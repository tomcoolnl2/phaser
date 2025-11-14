import path from 'path';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { PlayerDTO } from '@shared/dto/Player.dto';
import * as Utils from '@shared/utils';
import { GameConfig } from '@shared/config';
import { PlayerEvent, GameEvent, AsteroidEvent } from '@shared/events';
import { Coordinates } from '@shared/model';
import { AsteroidCauseOfDeath, AsteroidDTO, AsteroidHitDTO } from '@shared/dto/Asteroid.dto';
import { PickupDTO } from '@shared/dto/Pickup.dto';
import { GameSocket } from './model';
import { logger } from './logger';
import { HealthManager } from './HealthManager';

/**
 * GameServer is the authoritative multiplayer game server for Phaser ECS.
 *
 * Responsibilities:
 * - Manages player connections, authentication, and state
 * - Spawns and synchronizes asteroids and pickups
 * - Tracks health and destruction of all entities
 * - Emits and listens for all game events via Socket.IO
 * - Handles server-side business logic and DTO state transfer
 *
 * Usage:
 *   const server = new GameServer();
 *   server.start(3000);
 */
export class GameServer {
    /**
     * Express application instance for HTTP server.
     */
    private app = express();

    /**
     * Node.js HTTP server wrapping Express app.
     */
    private httpServer = createServer(this.app);

    /**
     * Socket.IO server for real-time multiplayer communication.
     */
    private io = new Server(this.httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    /**
     * Indicates if the game has started.
     */
    private gameHasStarted: boolean = false;

    /**
     * True if an asteroid is currently active in the game.
     */
    private hasAsteroid: boolean = false;

    /**
     * Manages health state for all asteroids.
     */
    private healthManager = new HealthManager();

    /**
     * Tracks destroyed asteroid IDs to prevent duplicate events.
     */
    private destroyedAsteroids: Set<string> = new Set();

    private asteroidMap: Map<string, AsteroidDTO> = new Map();

    /**
     * Constructs the GameServer, sets up Express and Socket.IO.
     */
    constructor() {
        this.setupExpress();
        this.setupSocketIO();
    }

    /**
     * Configures Express to serve static files and the main HTML page.
     */
    private setupExpress(): void {
        // Serve static files from public directory
        this.app.use(express.static('public'));

        // Serve index.html for root route
        this.app.get('/', (_req: Request, res: Response) => {
            res.sendFile(path.join(__dirname, '../../index.html'));
        });
    }

    /**
     * Sets up Socket.IO and attaches all event listeners for multiplayer sync.
     */
    private setupSocketIO(): void {
        this.io.on('connection', (socket: Socket) => {
            const gameSocket = socket as GameSocket;
            logger.info({ socketId: gameSocket.id }, 'Player connected');
            this.attachListeners(gameSocket);
        });
    }

    /**
     * Attaches all event listeners for a connected socket.
     * @param socket - The connected GameSocket
     */
    private attachListeners(socket: GameSocket): void {
        this.addSignOnListener(socket);
        this.addMovementListener(socket);
        this.addSignOutListener(socket);
        this.addHitListener(socket);
        this.addAsteroidHitListener(socket);
        this.addAsteroidDestroyListener(socket);
        this.addPickupListener(socket);
    }

    /**
     * Handles player authentication and game initialization.
     * @param socket - The connected GameSocket
     */
    private addSignOnListener(socket: GameSocket): void {
        socket.on(PlayerEvent.authenticate, (player: PlayerDTO, gameSize?: Coordinates) => {
            // Send existing players to new player
            socket.emit(PlayerEvent.players, this.getAllPlayers());

            // Create new player
            const windowSize = gameSize || { x: GameConfig.playArea.width, y: GameConfig.playArea.height };
            this.createPlayer(socket, player, windowSize);

            // Send new player data to them
            socket.emit(PlayerEvent.protagonist, socket.player);

            // Broadcast to all other players
            socket.broadcast.emit(PlayerEvent.joined, socket.player);

            // Initialize game if needed
            this.gameInitialised(socket);
        });
    }

    /**
     * Handles player movement updates from clients.
     * @param socket - The connected GameSocket
     */
    private addMovementListener(socket: GameSocket): void {
        socket.on(PlayerEvent.coordinates, (coordinates: Coordinates) => {
            socket.broadcast.emit(PlayerEvent.coordinates, {
                player: { ...socket.player, x: coordinates.x, y: coordinates.y } as PlayerDTO,
            });
        });
    }

    /**
     * Handles player disconnects and broadcasts quit events.
     * @param socket - The connected GameSocket
     */
    private addSignOutListener(socket: GameSocket): void {
        socket.on('disconnect', () => {
            if (socket.player) {
                logger.info({ playerId: socket.player.id, playerName: socket.player.name }, 'Player disconnected');
                socket.broadcast.emit(PlayerEvent.quit, socket.player.id);
            }
        });
    }

    /**
     * Handles player hit events and broadcasts to other clients.
     * @param socket - The connected Socket
     */
    private addHitListener(socket: Socket): void {
        socket.on(PlayerEvent.hit, (playerId: string) => {
            socket.broadcast.emit(PlayerEvent.hit, playerId);
        });
    }

    /**
     * Handles asteroid hit events, updates health, and emits destroy if dead.
     * @param socket - The connected Socket
     */
    private addAsteroidHitListener(socket: Socket): void {
        socket.on(AsteroidEvent.hit, ({ asteroidId, damage }: AsteroidHitDTO) => {
            if (this.destroyedAsteroids.has(asteroidId)) {
                return;
            }
            const asteroidDTO = this.asteroidMap.get(asteroidId);
            const health = this.healthManager.damage(asteroidId, damage);
            const maxHealth = this.healthManager.getMaxHealth(asteroidId);
            if (asteroidDTO) {
                asteroidDTO.health = health;
                asteroidDTO.maxHealth = maxHealth;
                this.io.emit(AsteroidEvent.hit, { asteroidId, damage });
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

    /**
     * Handles asteroid destroy events and broadcasts to other clients.
     * @param socket - The connected Socket
     */
    private addAsteroidDestroyListener(socket: Socket): void {
        socket.on(AsteroidEvent.destroy, (asteroidDTO: AsteroidDTO) => {
            socket.broadcast.emit(AsteroidEvent.destroy, asteroidDTO);
        });
    }

    /**
     * Handles pickup events and updates player state.
     * @param socket - The connected GameSocket
     */
    private addPickupListener(socket: GameSocket): void {
        socket.on(PlayerEvent.pickup, (pickupDTO: PickupDTO) => {
            socket.broadcast.emit(PlayerEvent.pickup, pickupDTO);
        });
    }

    /**
     * Creates a new player entity and assigns it to the socket.
     * @param socket - The connected GameSocket
     * @param player - Player data from client
     * @param windowSize - Game window size
     */
    private createPlayer(socket: GameSocket, player: PlayerDTO, windowSize: Coordinates): void {
        const id = uuidv4();
        const name = player.name || `Player ${Math.floor(Math.random() * 1000)}`;
        const x = this.randomInt(100, windowSize.x - 100);
        const y = this.randomInt(100, windowSize.y - 100);
        const spriteKey = player.spriteKey;
        const isLocal = false;
        const level = player.level ?? GameConfig.player.startingLevel;
        socket.player = new PlayerDTO(id, name, x, y, spriteKey, isLocal, level);;
    }

    /**
     * Returns all currently connected player entities.
     * @returns Array of PlayerDTO player objects
     */
    private getAllPlayers(): PlayerDTO[] {
        const sockets = Array.from(this.io.sockets.sockets.values()) as GameSocket[];
        return sockets.filter(s => s.player).map(s => s.player!);
    }

    /**
     * Initializes the game, spawning asteroids and pickups if not started.
     * @param socket - The connected GameSocket
     */
    private gameInitialised(socket: GameSocket): void {
        if (!this.gameHasStarted) {
            this.gameHasStarted = true;
            logger.info('Game started');
            this.createAsteroid(socket, GameConfig.server.asteroidSpawnInterval);
            this.spawnPickups(socket, GameConfig.server.pickupSpawnInterval);
        }
    }

    /**
     * Spawns a new asteroid at a random edge and starts its movement.
     * @param socket - The connected GameSocket
     * @param interval - Asteroid spawn interval in ms
     */
    private createAsteroid(socket: GameSocket, interval: number): void {
        setInterval(() => {
            if (!this.hasAsteroid) {
                const initialAsteroidHealth = GameConfig.asteroid.health;
                const asteroidId = uuidv4();
                const dto: AsteroidDTO = { id: asteroidId, health: initialAsteroidHealth, maxHealth: initialAsteroidHealth, x: 0, y: 0 };
                socket.asteroid = dto;
                this.hasAsteroid = true;
                this.healthManager.setHealth(asteroidId, initialAsteroidHealth, initialAsteroidHealth);
                this.destroyedAsteroids.delete(asteroidId); // ensure not marked destroyed

                logger.debug({ asteroidId }, 'Spawning asteroid');

                // Randomize spawn edge and direction
                const { width, height } = GameConfig.playArea;
                const { asteroidSpeed } = GameConfig.server;
                const threshold = 32;

                // Pick a random edge: 0=top, 1=bottom, 2=left, 3=right
                const edge = Math.floor(Math.random() * 4);
                let x = 0,
                    y = 0,
                    dx = 0,
                    dy = 0;

                switch (edge) {
                    case 0: // top
                        x = Math.random() * width;
                        y = -threshold;
                        dx = (Math.random() - 0.5) * asteroidSpeed;
                        dy = asteroidSpeed;
                        break;
                    case 1: // bottom
                        x = Math.random() * width;
                        y = height + threshold;
                        dx = (Math.random() - 0.5) * asteroidSpeed;
                        dy = -asteroidSpeed;
                        break;
                    case 2: // left
                        x = -threshold;
                        y = Math.random() * height;
                        dx = asteroidSpeed;
                        dy = (Math.random() - 0.5) * asteroidSpeed;
                        break;
                    case 3: // right
                    default:
                        x = width + threshold;
                        y = Math.random() * height;
                        dx = -asteroidSpeed;
                        dy = (Math.random() - 0.5) * asteroidSpeed;
                        break;
                }

                // Normalize direction to ensure it crosses the play area
                const norm = Math.sqrt(dx * dx + dy * dy);
                dx = (dx / norm) * asteroidSpeed;
                dy = (dy / norm) * asteroidSpeed;

                const asteroidDTO: AsteroidDTO = {
                    id: asteroidId,
                    x,
                    y,
                    dx,
                    dy,
                    health: initialAsteroidHealth,
                    maxHealth: initialAsteroidHealth,
                };

                this.asteroidMap.set(asteroidId, asteroidDTO);
                this.io.emit(AsteroidEvent.create, asteroidDTO);
                this.updateAsteroid(socket, asteroidDTO);
            }
        }, interval);
    }

    /**
     * Updates asteroid position, health, and destroys if off screen.
     * @param _socket - The connected GameSocket (unused)
     * @param asteroidDTO - The asteroid DTO to update
     */
    private updateAsteroid(_socket: GameSocket, asteroidDTO: AsteroidDTO): void {
        if (this.hasAsteroid) {
            const update = setInterval(() => {
                asteroidDTO.x += asteroidDTO.dx!;
                asteroidDTO.y += asteroidDTO.dy!;
                asteroidDTO.health = this.healthManager.getHealth(asteroidDTO.id);
                asteroidDTO.maxHealth = this.healthManager.getMaxHealth(asteroidDTO.id);
                this.asteroidMap.set(asteroidDTO.id, asteroidDTO);
                this.io.emit(AsteroidEvent.coordinates, asteroidDTO);

                // Destroy when off screen
                if (Utils.isOutOfBounds({ x: asteroidDTO.x, y: asteroidDTO.y, threshold: 64 }) && !this.destroyedAsteroids.has(asteroidDTO.id)) {
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

    /**
     * Spawns pickup items at random locations at a set interval.
     * @param socket - The connected Socket
     * @param interval - Pickup spawn interval in ms
     */
    private spawnPickups(socket: Socket, interval: number): void {
        setInterval(() => {
            const coordinates = this.generateRandomCoordinates();
            logger.debug({ coordinates }, 'Spawning pickup');
            this.io.emit(GameEvent.drop, coordinates);
        }, interval);
    }

    /**
     * Generates random coordinates for pickup spawning.
     * @returns Coordinates object with x and y
     */
    private generateRandomCoordinates(): Coordinates {
        return {
            x: this.randomInt(100, 924),
            y: this.randomInt(100, 668),
        };
    }

    /**
     * Returns a random integer between low (inclusive) and high (exclusive).
     * @param low - Lower bound
     * @param high - Upper bound
     * @returns Random integer
     */
    private randomInt(low: number, high: number): number {
        return Math.floor(Math.random() * (high - low) + low);
    }

    /**
     * Starts the game server on the specified port.
     * @param port - Port number to listen on (default: 3000)
     */
    public start(port: number = 3000): void {
        this.httpServer.listen(port, () => {
            logger.info({ port }, '🚀 Game server running');
        });
    }
}
