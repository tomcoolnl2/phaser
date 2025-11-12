import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import pino from 'pino';
import { PlayerEvent, GameEvent, AsteroidEvent } from '../shared/events';
import { SpaceShip, Coordinates, Player } from '../shared/models';
import { GameConfig } from '../shared/config';
import { AsteroidCauseOfDeath, AsteroidDTO } from '../shared/dto/AsteroidDTO';
import { PickupDTO, PickupType } from '../shared/dto/PickupDTO';

// Create logger instance
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport:
        process.env.NODE_ENV !== 'production'
            ? {
                  target: 'pino-pretty',
                  options:
                      {
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
    private healthManager = new HealthManager();
    private destroyedAsteroids: Set<string> = new Set();
    private asteroidMap: Map<string, AsteroidDTO> = new Map();

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
        this.addAsteroidDestroyListener(socket);
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
            if (this.destroyedAsteroids.has(asteroidId)) {
                return;
            }
            const hp = this.healthManager.damage(asteroidId, 1);
            const maxHp = this.healthManager.getMaxHealth(asteroidId);
            const asteroidDTO = this.asteroidMap.get(asteroidId);
            if (asteroidDTO) {
                asteroidDTO.hp = hp;
                asteroidDTO.maxHp = maxHp;
                this.io.emit(AsteroidEvent.hit, { ...asteroidDTO });
                if (this.healthManager.isDead(asteroidId)) {
                    asteroidDTO.causeOfDeath = AsteroidCauseOfDeath.HIT;
                    this.io.emit(AsteroidEvent.destroy, asteroidDTO);
                    this.destroyedAsteroids.add(asteroidId);
                    this.healthManager.remove(asteroidId);
                    this.hasAsteroid = false;
                    this.asteroidMap.delete(asteroidId);
                }
            }
        });
    }

    private addAsteroidDestroyListener(socket: Socket): void {
        socket.on(AsteroidEvent.destroy, (asteroidDTO: AsteroidDTO) => {
            socket.broadcast.emit(AsteroidEvent.destroy, asteroidDTO);
        });
    }

    private addPickupListener(socket: GameSocket): void {
        socket.on(PlayerEvent.pickup, (pickupDTO: PickupDTO) => {
            if (socket.player) {
                switch(pickupDTO.type) {
                    case PickupType.AMMO:
                        socket.player.ammo += pickupDTO.amount ? GameConfig.player.ammoPerPickup : 0;
                        break;
                    case PickupType.HEALTH:
                        // Handle health pickup when needed
                        break;
                }
            }
            socket.broadcast.emit(PlayerEvent.pickup, pickupDTO);
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
                this.healthManager.setHealth(asteroidId, 3, 3);
                this.destroyedAsteroids.delete(asteroidId); // ensure not marked destroyed

                logger.debug({ asteroidId }, 'Spawning asteroid');

                // Randomize spawn edge and direction
                const width = 1024; // TODO: use GameConfig
                const height = 768; // TODO: use GameConfig
                const speed = GameConfig.server.asteroidSpeed;

                // TODO: util function?
                // Pick a random edge: 0=top, 1=bottom, 2=left, 3=right
                const edge = Math.floor(Math.random() * 4);
                let x = 0, y = 0, dx = 0, dy = 0;
                if (edge === 0) { // top
                    x = Math.random() * width;
                    y = -32;
                    dx = (Math.random() - 0.5) * speed;
                    dy = speed;
                } else if (edge === 1) { // bottom
                    x = Math.random() * width;
                    y = height + 32;
                    dx = (Math.random() - 0.5) * speed;
                    dy = -speed;
                } else if (edge === 2) { // left
                    x = -32;
                    y = Math.random() * height;
                    dx = speed;
                    dy = (Math.random() - 0.5) * speed;
                } else { // right
                    x = width + 32;
                    y = Math.random() * height;
                    dx = -speed;
                    dy = (Math.random() - 0.5) * speed;
                }

                // Normalize direction to ensure it crosses the play area
                const norm = Math.sqrt(dx*dx + dy*dy);
                dx = (dx / norm) * speed;
                dy = (dy / norm) * speed;

                const asteroidDTO: AsteroidDTO = {
                    id: asteroidId,
                    x, y, dx, dy,
                    hp: 3, maxHp: 3,
                };

                this.asteroidMap.set(asteroidId, asteroidDTO);
                this.io.emit(AsteroidEvent.create, asteroidDTO);
                this.updateAsteroid(socket, asteroidDTO);
            }
        }, interval);
    }

    private updateAsteroid(_socket: GameSocket, asteroidDTO: AsteroidDTO): void {
        if (this.hasAsteroid) {
            const update = setInterval(() => {
                asteroidDTO.x += asteroidDTO.dx!;
                asteroidDTO.y += asteroidDTO.dy!;
                asteroidDTO.hp = this.healthManager.getHealth(asteroidDTO.id);
                asteroidDTO.maxHp = this.healthManager.getMaxHealth(asteroidDTO.id);
                this.asteroidMap.set(asteroidDTO.id, asteroidDTO);
                this.io.emit(AsteroidEvent.coordinates, asteroidDTO);

                // Destroy when off screen
                if (
                    (asteroidDTO.x < -64 || asteroidDTO.x > 1024 + 64 || // TODO: use GameConfig
                    asteroidDTO.y < -64 || asteroidDTO.y > 768 + 64) &&
                    !this.destroyedAsteroids.has(asteroidDTO.id)
                ) {
                    asteroidDTO.causeOfDeath = AsteroidCauseOfDeath.OFFSCREEN;
                    this.io.emit(AsteroidEvent.destroy, asteroidDTO);
                    this.destroyedAsteroids.add(asteroidDTO.id);
                    
                    this.hasAsteroid = false;
                    
                    this.healthManager.remove(asteroidDTO.id);
                    this.asteroidMap.delete(asteroidDTO.id);
                    
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

// Server-side HealthManager for all entities
class HealthManager {
    private healthMap = new Map<string, number>();
    private maxHealthMap = new Map<string, number>();

    setHealth(id: string, current: number, max: number) {
        this.healthMap.set(id, current);
        this.maxHealthMap.set(id, max);
    }

    getHealth(id: string): number {
        return this.healthMap.get(id) ?? 0;
    }

    getMaxHealth(id: string): number {
        return this.maxHealthMap.get(id) ?? 0;
    }

    damage(id: string, amount: number): number {
        let hp = this.getHealth(id);
        hp -= amount;
        this.healthMap.set(id, hp);
        return hp;
    }

    heal(id: string, amount: number): number {
        let hp = this.getHealth(id) + amount;
        const max = this.getMaxHealth(id);
        if (hp > max) hp = max;
        this.healthMap.set(id, hp);
        return hp;
    }

    isDead(id: string): boolean {
        return this.getHealth(id) <= 0;
    }

    remove(id: string) {
        this.healthMap.delete(id);
        this.maxHealthMap.delete(id);
    }
}

// Start the server
const server = new GameServer();
server.start(3000);

export { GameServer };
