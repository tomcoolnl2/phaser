import path from 'path';
import { createServer, Server as HttpServer } from 'http';
import express, { Express, Request, Response } from 'express';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import { PlayerDTO } from '@shared/dto/Player.dto';
import { AsteroidCauseOfDeath, AsteroidDTO, AsteroidHitDTO } from '@shared/dto/Asteroid.dto';
import { SocketRequestDTO } from '@shared/dto/SocketRequest.dto';
import { SocketResponseDTO } from '@shared/dto/SocketResponse.dto';
import { SocketResponseSchema } from '@shared/dto/Socket.schema';
import { Coordinates } from '@shared/model';
import { GameConfig } from '@shared/config';
import { Events } from '@shared/events';
import * as Utils from '@shared/utils';

import { playerFeatureListeners } from './listeners/player';
import { asteroidFeatureListeners } from './listeners/asteroid';
import { GameSocket } from './model';
import { logger } from './logger';
import { HealthManager } from './HealthManager';
import { GameServerContext } from './GameServerContext';

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
 * @example
 *   const server = new GameServer();
 *   server.start(3000);
 */
export class GameServer {
    private readonly app: Express;
    private readonly httpServer: HttpServer;
    private readonly io: Server;

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

    private featureListeners = [...playerFeatureListeners, ...asteroidFeatureListeners];

    /**
     * Constructs a new GameServer instance, sets up Express, HTTP, and Socket.IO, and registers listeners.
     */
    constructor() {
        this.app = express();
        this.httpServer = createServer(this.app);
        this.io = new Server(this.httpServer, {
            cors: { origin: '*', methods: ['GET', 'POST'] },
        });
        // Initialize GameServerContext with the current instance
        GameServerContext.initialize(this);
        this.setupExpress();
        this.setupSocketIO();
    }

    /**
     * Configures Express to serve static files and the main HTML page.
     */
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
    /**
     * Sets up Socket.IO and attaches all event listeners for multiplayer sync.
     */
    private setupSocketIO(): void {
        this.io.on('connection', (socket: Socket) => {
            const gameSocket = socket as GameSocket;
            logger.info({ socketId: gameSocket.id }, 'Player connected');
            this.registerFeatureListeners(gameSocket);
        });
    }

    /**
     * Registers all feature listeners (player, asteroid, etc.) for a given socket.
     * @param socket - The connected GameSocket
     */
    private registerFeatureListeners(socket: GameSocket): void {
        for (const listener of this.featureListeners) {
            socket.on(listener.event, async (request: SocketRequestDTO<never>) => {
                try {
                    await listener.handle(socket, request);
                } catch (e) {
                    console.error(`Error in listener "${listener.event}":`, e);
                    socket.emit('error', { ok: false, message: String(e) });
                }
            });
        }
    }

    /**
     * Checks if an asteroid has already been destroyed.
     */
    /**
     * Checks if an asteroid has already been destroyed.
     * @param asteroidId - The ID of the asteroid
     * @returns True if the asteroid is destroyed, false otherwise
     */
    public isAsteroidDestroyed(asteroidId: string): boolean {
        return this.destroyedAsteroids.has(asteroidId);
    }

    /**
     * Retrieves an asteroid by its ID.
     */
    /**
     * Retrieves an asteroid by its ID.
     * @param asteroidId - The ID of the asteroid
     * @returns The AsteroidDTO if found, otherwise undefined
     */
    public getAsteroid(asteroidId: string): AsteroidDTO | undefined {
        return this.asteroidMap.get(asteroidId);
    }

    /**
     * Apply damage to an asteroid. Returns updated DTO or null if not found.
     */
    /**
     * Apply damage to an asteroid. Returns updated DTO or null if not found.
     * @param asteroidId - The ID of the asteroid
     * @param damage - The amount of damage to apply
     * @returns The updated AsteroidDTO, or null if not found
     */
    public damageAsteroid(asteroidId: string, damage: number): AsteroidDTO | null {
        const asteroid = this.asteroidMap.get(asteroidId);
        if (!asteroid) return null;

        asteroid.health = this.healthManager.damage(asteroidId, damage);
        asteroid.maxHealth = this.healthManager.getMaxHealth(asteroidId);

        return asteroid;
    }

    /**
     * Destroys an asteroid and cleans up its state.
     */
    /**
     * Destroys an asteroid and cleans up its state.
     * @param asteroidId - The ID of the asteroid
     * @param cause - The cause of death for the asteroid
     * @returns The destroyed AsteroidDTO, or null if not found
     */
    public destroyAsteroid(asteroidId: string, cause: AsteroidCauseOfDeath): AsteroidDTO | null {
        const asteroid = this.asteroidMap.get(asteroidId);
        if (!asteroid) return null;

        asteroid.causeOfDeath = cause;
        this.destroyedAsteroids.add(asteroidId);
        this.healthManager.remove(asteroidId);
        this.hasAsteroid = false;
        this.asteroidMap.delete(asteroidId);

        return asteroid;
    }

    /**
     * Broadcasts an asteroid hit event to all clients.
     */
    /**
     * Broadcasts an asteroid hit event to all clients.
     * @param payload - The SocketResponseDTO containing the hit data
     */
    public broadcastAsteroidHit(payload: SocketResponseDTO<AsteroidHitDTO>): void {
        this.io.emit(Events.Asteroid.hit, payload);
    }

    /**
     * Broadcasts an asteroid destroy event to all clients.
     */
    /**
     * Broadcasts an asteroid destroy event to all clients.
     * @param payload - The SocketResponseDTO containing the destroyed asteroid data
     */
    public broadcastAsteroidDestroy(payload: SocketResponseDTO<AsteroidDTO>): void {
        this.io.emit(Events.Asteroid.destroy, payload);
    }

    /**
     * Marks an asteroid as destroyed in the server state.
     * @param id - The ID of the asteroid
     */
    public markAsteroidDestroyed(id: string): void {
        this.destroyedAsteroids.add(id);
    }

    /**
     * Creates a new player entity and assigns it to the socket.
     * @param socket - The connected GameSocket
     * @param player - Player data from client
     * @param windowSize - Game window size
     */
    /**
     * Creates a new player entity and assigns it to the socket.
     * @param socket - The connected GameSocket
     * @param playerName - The player's name
     * @param windowSize - The game window size
     */
    public createPlayer(socket: GameSocket, playerName: string, windowSize: Coordinates): void {
        const id = uuidv4();
        const name = playerName || `Player ${Math.floor(Math.random() * 1000)}`;
        const x = this.randomInt(100, windowSize.x - 100);
        const y = this.randomInt(100, windowSize.y - 100);
        const spriteKey = 'shooter-sprite-enemy';
        const isLocal = false;
        const level = GameConfig.player.startingLevel;
        socket.player = new PlayerDTO(id, name, x, y, spriteKey, isLocal, level);
    }

    /**
     * Returns all currently connected player entities.
     * @returns Array of PlayerDTO player objects
     */
    /**
     * Returns all currently connected player entities.
     * @returns Array of PlayerDTO player objects
     */
    public getAllPlayers(): PlayerDTO[] {
        const sockets = Array.from(this.io.sockets.sockets.values()) as GameSocket[];
        return sockets.filter(s => s.player).map(s => s.player!);
    }

    /**
     * Initializes the game, spawning asteroids and pickups if not started.
     * @param socket - The connected GameSocket
     */
    /**
     * Initializes the game, spawning asteroids and pickups if not started.
     * @param socket - The connected GameSocket
     */
    public gameInitialised(socket: GameSocket): void {
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

                try {
                    const response: SocketResponseDTO<AsteroidDTO> = { ok: true, dto: asteroidDTO };
                    SocketResponseSchema.parse(response);
                    this.io.emit(Events.Asteroid.create, response);
                    this.updateAsteroid(socket, asteroidDTO);
                } catch (e) {
                    const message = e instanceof Error ? e.message : e.toString();
                    logger.error({ error: message }, 'Failed to spawn pickup due to invalid coordinates');
                }
            }
        }, interval);
    }

    /**
     * Updates asteroid position, health, and destroys if off screen.
     * @param _socket - The connected GameSocket (unused)
     * @param asteroidDTO - The asteroid DTO to update
     */
    /**
     * Updates asteroid position, health, and destroys if off screen.
     * @param _socket - The connected GameSocket (unused)
     * @param asteroidDTO - The asteroid DTO to update
     */
    private updateAsteroid(_socket: GameSocket, asteroidDTO: AsteroidDTO): void {
        if (this.hasAsteroid) {
            const update = setInterval(() => {
                try {
                    asteroidDTO.x += asteroidDTO.dx!;
                    asteroidDTO.y += asteroidDTO.dy!;
                    asteroidDTO.health = this.healthManager.getHealth(asteroidDTO.id);
                    asteroidDTO.maxHealth = this.healthManager.getMaxHealth(asteroidDTO.id);
                    this.asteroidMap.set(asteroidDTO.id, asteroidDTO);
                    const response: SocketResponseDTO<AsteroidDTO> = { ok: true, dto: asteroidDTO };
                    SocketResponseSchema.parse(response);
                    this.io.emit(Events.Asteroid.coordinates, response);

                    // Destroy when off screen
                    if (Utils.isOutOfBounds({ x: asteroidDTO.x, y: asteroidDTO.y, threshold: 64 }) && !this.destroyedAsteroids.has(asteroidDTO.id)) {
                        asteroidDTO.causeOfDeath = AsteroidCauseOfDeath.OFFSCREEN;
                        try {
                            this.io.emit(Events.Asteroid.destroy, response);
                            this.destroyedAsteroids.add(asteroidDTO.id);
                            this.hasAsteroid = false;
                            this.healthManager.remove(asteroidDTO.id);
                            this.asteroidMap.delete(asteroidDTO.id);
                            clearInterval(update);
                            logger.debug('Asteroid destroyed (off screen)');
                        } catch (e) {
                            const message = e instanceof Error ? e.message : e.toString();
                            this.io.emit(Events.Asteroid.destroy, { ok: false, message, dto: asteroidDTO });
                            logger.error({ error: message }, `Invalid SocketResponse for ${Events.Asteroid.destroy}`);
                        }
                    }
                } catch (e) {
                    const message = e instanceof Error ? e.message : e.toString();
                    logger.error({ error: message }, 'Failed to spawn pickup due to invalid coordinates');
                }
            }, 25);
        }
    }

    /**
     * Spawns pickup items at random locations at a set interval.
     * @param socket - The connected Socket
     * @param interval - Pickup spawn interval in ms
     */
    /**
     * Spawns pickup items at random locations at a set interval.
     * @param _socket - The connected Socket
     * @param interval - Pickup spawn interval in ms
     */
    private spawnPickups(_socket: Socket, interval: number): void {
        setInterval(() => {
            try {
                const coordinates = this.generateRandomCoordinates();
                const response: SocketResponseDTO<Coordinates> = { ok: true, dto: coordinates };
                SocketResponseSchema.parse(response);
                logger.debug({ coordinates }, 'Spawning pickup');
                this.io.emit(Events.Game.drop, response);
            } catch (e) {
                const message = e instanceof Error ? e.message : e.toString();
                logger.error({ error: message }, 'Failed to spawn pickup due to invalid coordinates');
            }
        }, interval);
    }

    /**
     * Generates random coordinates for pickup spawning.
     * @returns Coordinates object with x and y
     */
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
