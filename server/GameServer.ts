import path from 'path';
import { createServer, Server as HttpServer } from 'http';
import express, { Express, Request, Response } from 'express';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import { Coordinates } from '@shared/model';
import { GameConfig } from '@shared/config';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { AsteroidCauseOfDeath, AsteroidDTO, AsteroidHitDTO } from '@shared/dto/Asteroid.dto';
import { AmmoPickupDTO, CoinPickupDTO, HealthPickupDTO, PickupDTO, PickupType } from '@shared/dto/Pickup.dto';
import { ProjectileDTO } from '@shared/dto/Projectile.dto';
import { SocketRequestDTO } from '@shared/dto/SocketRequest.dto';
import { SocketResponseDTO } from '@shared/dto/SocketResponse.dto';
import { WeaponDTO } from '@shared/dto/Weapon.dto';
import { SocketResponseSchema } from '@shared/schema/Socket.schema';
import { Events } from '@shared/events';
import { ProjectileRefillAmount } from '@shared/types';
import * as Utils from '@shared/utils';

import { playerFeatureListeners } from './listeners/player';
import { asteroidFeatureListeners } from './listeners/asteroid';

import { GameSocket } from './model';
import { GameServerUtils } from './GameServerUtils';
import { GameServerContext } from './GameServerContext';
import { HealthManager } from './HealthManager';
import { logger } from './logger';

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

    /** Indicates if the game has started. */
    private gameHasStarted: boolean = false;

    /** Map of projectile IDs to their DTOs. */
    private projectileMap: Map<string, ProjectileDTO> = new Map();

    /** Set of destroyed projectile IDs to prevent duplicate events. */
    private destroyedProjectiles: Set<string> = new Set();

    /** True if an asteroid is currently active in the game. */
    private hasAsteroid: boolean = false;

    /** Map of asteroid IDs to their DTOs. */
    private asteroidMap: Map<string, AsteroidDTO> = new Map();
    /** Set of destroyed asteroid IDs to prevent duplicate events. */

    private destroyedAsteroids: Set<string> = new Set();
    /** Manages health state for all asteroids. */

    private healthManager = new HealthManager();

    /** Manages health state for all asteroids. */
    private playerScoreManager = new HealthManager();

    /**
     * Constructs a new GameServer instance, sets up Express, HTTP, and Socket.IO, and registers listeners.
     */
    constructor() {
        this.app = express();
        this.httpServer = createServer(this.app);
        this.io = new Server(this.httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });
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
        const name = playerName || `Player ${Math.floor(Math.random() * 1000)}`;
        const x = Utils.randomInt(100, windowSize.x - 100);
        const y = Utils.randomInt(100, windowSize.y - 100);
        socket.player = new PlayerDTO({ name, x, y, spriteKey: 'shooter-sprite-enemy', isLocal: false });
        this.healthManager.setHealth(socket.player.id, socket.player.maxHealth, socket.player.maxHealth);
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

    public broadcastPlayerShoot(payload: SocketResponseDTO<ProjectileDTO>): void {
        this.io.emit(Events.Projectile.create, payload);
    }

    public broadcastPlayerPickup(payload: SocketResponseDTO<PickupDTO>): void {
        this.io.emit(Events.Player.pickup, payload);
    }

    /**
     * Returns all currently connected player entities.
     * @returns Array of PlayerDTO player objects
     */
    public getAllPlayers(): PlayerDTO[] {
        const sockets = Array.from(this.io.sockets.sockets.values()) as GameSocket[];
        return sockets.filter(s => s.player).map(s => s.player!);
    }

    /**
     * Creates a new projectile DTO, calculates direction, adds it to the projectile map, and starts updating its position.
     * @param player - The player DTO (for position and ownerId)
     * @param weapon - The weapon DTO (for type, speed, damage)
     * @param target - The target position { x, y }
     */
    public createProjectile({ id: ownerId, x, y, level, angle }: PlayerDTO, { ammoType: projectileType, damage, speed }: WeaponDTO): ProjectileDTO {
        const collisionRadius = GameConfig.projectile.collisionRaduis; // TODO: adjust per ammoType if needed
        const spriteKey = `projectile-${level}`;
        const { dx, dy } = GameServerUtils.directionFromAngle(angle);
        const projectile = new ProjectileDTO({ ownerId, spriteKey, projectileType, collisionRadius, damage, x, y, dx, dy, speed });
        this.projectileMap.set(projectile.id, projectile);
        this.updateProjectile(projectile);
        return projectile;
    }

    /**
     * Updates projectile position at a fixed interval and broadcasts to clients.
     * Removes projectile if it goes off screen.
     * @param projectile - The projectile DTO to update
     */
    private updateProjectile(projectile: ProjectileDTO): void {
        const intervalMs = 25;
        const deltaTime = intervalMs / 1000; // seconds
        const update = setInterval(() => {
            try {
                projectile.x += projectile.dx * projectile.speed * deltaTime;
                projectile.y += projectile.dy * projectile.speed * deltaTime;
                this.projectileMap.set(projectile.id, projectile);
                const response = { ok: true, dto: projectile };
                SocketResponseSchema.parse(response);
                this.io.emit(Events.Projectile.coordinates, response);

                // Remove projectile if off screen
                if (Utils.isOutOfBounds({ x: projectile.x, y: projectile.y, threshold: 64 }) && !this.destroyedProjectiles.has(projectile.id)) {
                    this.destroyedProjectiles.add(projectile.id);
                    this.projectileMap.delete(projectile.id);
                    logger.debug({ projectileId: projectile.id }, 'projectile out of bounds');
                    clearInterval(update);
                    // Optionally emit a destroy event
                    this.io.emit(Events.Projectile.destroy, { ok: true, dto: projectile });
                }
            } catch (e) {
                const message = e instanceof Error ? e.message : e.toString();
                this.io.emit(Events.Projectile.destroy, { ok: false, message, dto: projectile });
                clearInterval(update);
            }
        }, intervalMs);
    }

    /**
     * Returns all currently active projectiles.
     */
    public getAllProjectiles(): ProjectileDTO[] {
        return Array.from(this.projectileMap.values());
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
            // TODO: allow more asteroids at the same time
            if (this.hasAsteroid) {
                return;
            }

            const asteroidDTO = GameServerUtils.createAsteroidDTO();

            this.hasAsteroid = true;
            this.healthManager.setHealth(asteroidDTO.id, asteroidDTO.health, asteroidDTO.maxHealth);
            this.destroyedAsteroids.delete(asteroidDTO.id); // ensure not marked destroyed
            this.asteroidMap.set(asteroidDTO.id, asteroidDTO);

            logger.debug({ asteroidId: asteroidDTO.id }, 'Spawning asteroid');

            try {
                const response: SocketResponseDTO<AsteroidDTO> = { ok: true, dto: asteroidDTO };
                SocketResponseSchema.parse(response);
                this.io.emit(Events.Asteroid.create, response);
                this.updateAsteroid(socket, asteroidDTO);
            } catch (e) {
                const message = e instanceof Error ? e.message : e.toString();
                logger.error({ error: message }, 'Failed to spawn pickup due to invalid coordinates');
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
                    const response = { ok: true, dto: asteroidDTO };
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
                let dto = { type, id, x, y } as Partial<PickupDTO>;
                switch (type) {
                    case PickupType.AMMO:
                        dto = {
                            ...dto,
                            amount: ProjectileRefillAmount.BULLET,
                        } as AmmoPickupDTO;
                        break;
                    case PickupType.HEALTH:
                        dto = {
                            ...dto,
                            amount: 1,
                        } as HealthPickupDTO;
                        break;
                    case PickupType.COIN:
                        dto = {
                            ...dto,
                            points: 50,
                        } as CoinPickupDTO;
                        break;
                }
                this.io.emit(Events.Game.drop, { ok: true, dto });
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
