import path from 'path';
import { createServer, Server as HttpServer } from 'http';
import express, { Express, Request, Response } from 'express';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import { PlayerDTO } from '@shared/dto/Player.dto';
import { AsteroidCauseOfDeath, AsteroidDTO, AsteroidHitDTO } from '@shared/dto/Asteroid.dto';
import { PickupDTO, PickupType } from '@shared/dto/Pickup.dto';
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
import { AmmoAmount } from '@shared/types';

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

/**
 * The main authoritative multiplayer game server for Phaser ECS.
 * Handles player management, asteroid and pickup spawning, event broadcasting, and server setup.
 */
export class GameServer {
    // --- Server Setup & Infrastructure ---

    /** Express app instance for HTTP server. */
    private readonly app: Express;
    /** Node HTTP server instance. */
    private readonly httpServer: HttpServer;
    /** Socket.IO server instance. */
    private readonly io: Server;

    /** Combined feature listeners for player and asteroid events. */
    private featureListeners = [...playerFeatureListeners, ...asteroidFeatureListeners];

    // --- Game Lifecycle & Player Management ---

    /** Indicates if the game has started. */
    private gameHasStarted: boolean = false;

    // --- Asteroid Lifecycle ---

    /** True if an asteroid is currently active in the game. */
    private hasAsteroid: boolean = false;
    /** Map of asteroid IDs to their DTOs. */
    private asteroidMap: Map<string, AsteroidDTO> = new Map();
    /** Set of destroyed asteroid IDs to prevent duplicate events. */
    private destroyedAsteroids: Set<string> = new Set();
    /** Manages health state for all asteroids. */
    private healthManager = new HealthManager();

    // --- Constructor ---

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

    // --- Game Lifecycle & Player Management ---

    /**
     * Starts the game server on the specified port.
     * @param port - Port number to listen on (default: 3000)
     */
    public start(port: number = 3000): void {
        this.httpServer.listen(port, () => {
            logger.info({ port }, '🚀 Game server running');
        });
    }

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
     * Creates a new player DTO and assigns it to the socket.
     * @param socket - The connected GameSocket
     * @param playerName - The player's name
     * @param windowSize - The game window size
     */
    public createPlayer(socket: GameSocket, playerName: string, windowSize: Coordinates): void {
        const id = uuidv4();
        const name = playerName || `Player ${Math.floor(Math.random() * 1000)}`;
        const x = Utils.randomInt(100, windowSize.x - 100);
        const y = Utils.randomInt(100, windowSize.y - 100);
        const spriteKey = 'shooter-sprite-enemy';
        const isLocal = false;
        const level = GameConfig.player.startingLevel;
        socket.player = new PlayerDTO(id, name, x, y, spriteKey, isLocal, level);
        this.healthManager.setHealth(id, socket.player.maxHealth, socket.player.maxHealth);
    }

    /**
     * Subtracts health from a player and triggers destroy logic if health reaches zero.
     * @param playerId - The ID of the player
     * @param damage - The amount of health to subtract
     * @returns The updated PlayerDTO, or null if not found
     */
    public damagePlayer(playerId: string, damage: number): PlayerDTO | null {
        const sockets = Array.from(this.io.sockets.sockets.values()) as GameSocket[];
        const socket = sockets.find(s => s.player && s.player.id === playerId);
        if (!socket || !socket.player) {
            return null;
        }

        socket.player.health = Math.max(0, (socket.player.health || 0) - damage);
        console.log(`Player ${playerId} took ${damage} damage, health now ${socket.player.health}`);
        if (socket.player.health <= 0) {
            const response = { ok: true, dto: socket.player };
            this.broadcastPlayerDied(response);
            this.detonateAllAsteroids();
        }

        return socket.player;
    }

    /**
     * Destroys an asteroid and cleans up its state.
     * @param asteroidId - The ID of the asteroid
     * @param cause - The cause of death for the asteroid
     * @returns The destroyed AsteroidDTO, or null if not found
     */
    public destroyPlayer(playerDTO: PlayerDTO): PlayerDTO | null {
        if (!playerDTO.id) {
            return null;
        }
        this.healthManager.remove(playerDTO.id);
        return playerDTO;
    }

    /**
     * Broadcasts when a player dies  event to all clients.
     * @param payload - The SocketResponseDTO containing the destroyed player data
     */
    public broadcastPlayerDied(payload: SocketResponseDTO<PlayerDTO>): void {
        this.io.emit(Events.Player.destroy, payload);
    }

    /**
     * Returns all currently connected player entities.
     * @returns Array of PlayerDTO player objects
     */
    public getAllPlayers(): PlayerDTO[] {
        const sockets = Array.from(this.io.sockets.sockets.values()) as GameSocket[];
        return sockets.filter(s => s.player).map(s => s.player!);
    }

    // --- Asteroid Lifecycle ---
    /**
     * Spawns a new asteroid at a random edge and starts its movement.
     * @param socket - The connected GameSocket
     * @param interval - Asteroid spawn interval in ms
     */
    private createAsteroid(socket: GameSocket, interval: number): void {
        // TODO: clear interval when game is paused or ended
        // TODO: resume interval when game is resumed
        setInterval(() => {
            if (!this.hasAsteroid) {
                // TODO: allow more asteroids at the same time
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
     * @param asteroidId - The ID of the asteroid
     * @param cause - The cause of death for the asteroid
     * @returns The destroyed AsteroidDTO, or null if not found
     */
    public destroyAsteroid(asteroidId: string, cause: AsteroidCauseOfDeath): AsteroidDTO | null {
        const asteroid = this.asteroidMap.get(asteroidId);
        if (!asteroid) {
            return null;
        }

        asteroid.causeOfDeath = cause;
        this.destroyedAsteroids.add(asteroidId);
        this.healthManager.remove(asteroidId);
        this.hasAsteroid = false;
        this.asteroidMap.delete(asteroidId);

        return asteroid;
    }

    public detonateAllAsteroids(): void {
        // get all asteroids and end their life
        for (const asteroid of this.getAllAsteroids()) {
            // emit to server Events.Asteroid.destroy
            asteroid.causeOfDeath = AsteroidCauseOfDeath.GAME_ENDED;
            const request = { ok: true, dto: asteroid };
            this.broadcastAsteroidDestroy(request);
        }
    }

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
     * @param asteroidId - The ID of the asteroid
     * @returns The AsteroidDTO if found, otherwise undefined
     */
    public getAsteroid(asteroidId: string): AsteroidDTO | undefined {
        return this.asteroidMap.get(asteroidId);
    }

    public getAllAsteroids(): AsteroidDTO[] {
        return Array.from(this.asteroidMap.values());
    }

    /**
     * Marks an asteroid as destroyed in the server state.
     * @param id - The ID of the asteroid
     */
    public markAsteroidDestroyed(id: string): void {
        this.destroyedAsteroids.add(id);
    }

    /**
     * Broadcasts an asteroid hit event to all clients.
     * @param payload - The SocketResponseDTO containing the hit data
     */
    public broadcastAsteroidHit(payload: SocketResponseDTO<AsteroidHitDTO>): void {
        this.io.emit(Events.Asteroid.hit, payload);
    }

    /**
     * Broadcasts an asteroid destroy event to all clients.
     * @param payload - The SocketResponseDTO containing the destroyed asteroid data
     */
    public broadcastAsteroidDestroy(payload: SocketResponseDTO<AsteroidDTO>): void {
        this.io.emit(Events.Asteroid.destroy, payload);
    }

    // --- Pickup Lifecycle ---
    /**
     * Spawns pickup items at random locations at a set interval.
     * @param _socket - The connected Socket
     * @param interval - Pickup spawn interval in ms
     */
    private spawnPickups(_socket: Socket, interval: number): void {
        setInterval(() => {
            try {
                // Use PickupType enum for type safety
                const pickupTypes = [PickupType.AMMO, PickupType.HEALTH, PickupType.COIN];
                const type = pickupTypes[Math.floor(Math.random() * pickupTypes.length)];
                const { x, y } = this.generateRandomCoordinates();
                const id = uuidv4();
                let dto;
                switch (type) {
                    case PickupType.AMMO:
                        dto = {
                            type,
                            id,
                            x,
                            y,
                            amount: AmmoAmount.BULLET,
                        };
                        break;
                    case PickupType.HEALTH:
                        dto = {
                            type,
                            id,
                            x,
                            y,
                            amount: 1,
                        };
                        break;
                    case PickupType.COIN:
                        dto = {
                            type,
                            id,
                            x,
                            y,
                            points: 50,
                        };
                        break;
                }
                this.io.emit(Events.Game.drop, { ok: true, dto: dto as PickupDTO });
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
    private generateRandomCoordinates(): Coordinates {
        return {
            x: Utils.randomInt(100, 924),
            y: Utils.randomInt(100, 668),
        };
    }

    // --- Server Setup & Infrastructure ---
    /**
     * Configures Express to serve static files and the main HTML page.
     */
    private setupExpress(): void {
        this.app.use(express.static('public'));
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
}
