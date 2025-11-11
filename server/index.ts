import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import pino from 'pino';
import { PlayerEvent, GameEvent, AsteroidEvent } from '../shared/events';
import { SpaceShip, Coordinates, Player, PickupData } from '../shared/models';
import { GameConfig } from '../shared/config';

// Create logger instance
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport:
        process.env.NODE_ENV !== 'production'
            ? {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      translateTime: 'HH:MM:ss',
                      ignore: 'pid,hostname',
                  },
              }
            : undefined,
});

// Extended socket type with custom properties
interface GameSocket extends Socket {
    player?: SpaceShip;
    asteroid?: {
        id: string;
    };
}

class GameServer {
    private app = express();
    private httpServer = createServer(this.app);
    private io = new Server(this.httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    private gameHasStarted: boolean = false;
    private hasAsteroid: boolean = false;

    constructor() {
        this.setupExpress();
        this.setupSocketIO();
    }

    private setupExpress(): void {
        // Serve static files from public directory
        this.app.use(express.static('public'));

        // Serve index.html for root route
        this.app.get('/', (_req: Request, res: Response) => {
            res.sendFile(path.join(__dirname, '../../index.html'));
        });
    }

    private setupSocketIO(): void {
        this.io.on('connection', (socket: GameSocket) => {
            logger.info({ socketId: socket.id }, 'Player connected');
            this.attachListeners(socket);
        });
    }

    private attachListeners(socket: GameSocket): void {
        this.addSignOnListener(socket);
        this.addMovementListener(socket);
        this.addSignOutListener(socket);
        this.addHitListener(socket);
    this.addAsteroidHitListener(socket);
        this.addPickupListener(socket);
    }

    private addSignOnListener(socket: GameSocket): void {
        socket.on(PlayerEvent.authenticate, (player: Player, gameSize?: Coordinates) => {
            // Send existing players to new player
            socket.emit(PlayerEvent.players, this.getAllPlayers());

            // Create new player
            const windowSize = gameSize || { x: 1024, y: 768 };
            this.createPlayer(socket, player, windowSize);

            // Send new player data to them
            socket.emit(PlayerEvent.protagonist, socket.player);

            // Broadcast to all other players
            socket.broadcast.emit(PlayerEvent.joined, socket.player);

            // Initialize game if needed
            this.gameInitialised(socket);
        });
    }

    private addMovementListener(socket: GameSocket): void {
        socket.on(PlayerEvent.coordinates, (coords: Coordinates) => {
            socket.broadcast.emit(PlayerEvent.coordinates, {
                coors: coords,
                player: socket.player,
            });
        });
    }

    private addSignOutListener(socket: GameSocket): void {
        socket.on('disconnect', () => {
            if (socket.player) {
                logger.info({ playerId: socket.player.id, playerName: socket.player.name }, 'Player disconnected');
                socket.broadcast.emit(PlayerEvent.quit, socket.player.id);
            }
        });
    }

    private addHitListener(socket: Socket): void {
        socket.on(PlayerEvent.hit, (playerId: string) => {
            socket.broadcast.emit(PlayerEvent.hit, playerId);
        });
    }

    private addAsteroidHitListener(socket: Socket): void {
        socket.on(AsteroidEvent.hit, (asteroidId: string) => {
            socket.broadcast.emit(AsteroidEvent.hit, asteroidId);
        });
    }

    private addPickupListener(socket: GameSocket): void {
        socket.on(PlayerEvent.pickup, (data: PickupData) => {
            if (socket.player) {
                socket.player.ammo = data.ammo ? GameConfig.player.ammoPerPickup : 0;
            }
            socket.broadcast.emit(PlayerEvent.pickup, data.uuid);
        });
    }

    private createPlayer(socket: GameSocket, player: Player, windowSize: Coordinates): void {
        socket.player = {
            name: player.name || `Player ${Math.floor(Math.random() * 1000)}`,
            id: uuidv4(),
            ammo: GameConfig.player.startingAmmo,
            x: this.randomInt(100, windowSize.x - 100),
            y: this.randomInt(100, windowSize.y - 100),
        };
    }

    private getAllPlayers(): SpaceShip[] {
        const sockets = Array.from(this.io.sockets.sockets.values()) as GameSocket[];
        return sockets.filter(s => s.player).map(s => s.player!);
    }

    private gameInitialised(socket: GameSocket): void {
        if (!this.gameHasStarted) {
            this.gameHasStarted = true;
            logger.info('Game started');
            this.createAsteroid(socket, GameConfig.server.asteroidSpawnInterval);
            this.spawnPickups(socket, GameConfig.server.pickupSpawnInterval);
        }
    }

    private createAsteroid(socket: GameSocket, interval: number): void {
        setInterval(() => {
            if (!this.hasAsteroid) {
                const asteroidId = uuidv4();
                socket.asteroid = { id: asteroidId };
                this.hasAsteroid = true;

                logger.debug({ asteroidId }, 'Spawning asteroid');

                this.io.emit(AsteroidEvent.create, socket.asteroid);
                this.updateAsteroid(socket);
            }
        }, interval);
    }

    private updateAsteroid(_socket: GameSocket): void {
        if (this.hasAsteroid) {
            const asteroidCoordinates: Coordinates & { r?: number } = {
                x: this.randomInt(200, 800),
                y: -128,
            };

            const update = setInterval(() => {
                asteroidCoordinates.y += GameConfig.server.asteroidSpeed;
                asteroidCoordinates.x -= 1;

                this.io.emit(AsteroidEvent.coordinates, asteroidCoordinates);

                // Destroy if off screen
                if (asteroidCoordinates.y > 900 || asteroidCoordinates.x < -128) {
                    this.io.emit(AsteroidEvent.destroy);
                    this.hasAsteroid = false;
                    clearInterval(update);
                    logger.debug('Asteroid destroyed (off screen)');
                }
            }, 25);
        }
    }

    private spawnPickups(socket: Socket, interval: number): void {
        setInterval(() => {
            const coordinates = this.generateRandomCoordinates();
            logger.debug({ coordinates }, 'Spawning pickup');
            this.io.emit(GameEvent.drop, coordinates);
        }, interval);
    }

    private generateRandomCoordinates(): Coordinates {
        return {
            x: this.randomInt(100, 924),
            y: this.randomInt(100, 668),
        };
    }

    private randomInt(low: number, high: number): number {
        return Math.floor(Math.random() * (high - low) + low);
    }

    public start(port: number = 3000): void {
        this.httpServer.listen(port, () => {
            logger.info({ port }, '🚀 Game server running');
        });
    }
}

// Start the server
const server = new GameServer();
server.start(3000);

export { GameServer };
