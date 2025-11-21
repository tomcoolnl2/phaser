import Phaser from 'phaser';
import { Socket } from 'socket.io-client';

import { Events } from '@shared/events';
import { GameConfig } from '@shared/config';
import { SocketResponseDTO } from '@shared/dto/SocketResponse.dto';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { PickupDTO, PickupType } from '@shared/dto/Pickup.dto';
import { AsteroidHitDTO } from '@shared/dto/Asteroid.dto';
import { SocketRequestSchema } from '@shared/schema/Socket.schema';
import { SignOnDTO } from '@shared/dto/SignOn.dto';
import { CoordinatesDTO } from '@shared/dto/Coordinates.dto';
import { WeaponDTO } from '@shared/dto/Weapon.dto';

import { Entity } from '@/ecs/core/Entity';
import { EntityManager } from '@/ecs/core/EntityManager';

import { ScoreSystem } from '@/ecs/systems/ScoreSystem';
import { InputSystem } from '@/ecs/systems/InputSystem';
import { MovementSystem } from '@/ecs/systems/MovementSystem';
import { WeaponSystem } from '@/ecs/systems/WeaponSystem';
import { WeaponUpgradeSystem } from '@/ecs/systems/WeaponUpgradeSystem';
import { RenderSystem } from '@/ecs/systems/RenderSystem';
import { AsteroidSystem } from '@/ecs/systems/AsteroidSystem';
import { PickupSystem } from '@/ecs/systems/PickupSystem';
import { PlayerSystem } from '@/ecs/systems/PlayerSystem';
import { ProjectileSystem } from '@/ecs/systems/ProjectileSystem';
import { PlayerEntityFactory } from '@/ecs/factories/PlayerEntityFactory';

import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { ScoreComponent } from '@/ecs/components/ScoreComponent';
import { PickupComponent } from '@/ecs/components/PickupComponent';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { AsteroidComponent } from '@/ecs/components/AsteroidComponent';
import { createFeatureListeners } from '@/listeners';


/**
 * Main gameplay scene that manages all game entities and ECS systems.
 *
 * GameScene handles:
 * - Player spawning and management using pure ECS architecture
 * - ECS system integration (input, movement, weapons, upgrades, rendering)
 * - Asteroid spawning and collision detection
 * - Pickup item spawning and collection
 * - Socket.IO networking for multiplayer synchronization
 * - HUD updates via custom events to Vue.js frontend
 *
 * All players (local and remote) are now managed as ECS entities.
 *
 * @example
 * ```typescript
 * // Scene is automatically started by BootScene
 * // Socket events trigger player/asteroid/pickup creation
 * ```
 */

export class GameScene extends Phaser.Scene {
    /**
     * Socket.IO connection for multiplayer networking.
     * Set during scene creation from the registry.
     * @private
     */
    private socket!: Socket;

    /**
     * The ID of the local player entity, or null if not set.
     * Used to distinguish the local player from remote players.
     * @private
     */
    private localPlayerId: string | null = null;

    /**
     * Map of player entities by player ID.
     * Used for quick lookup and management of all player ECS entities.
     * @private
     */
    private playerEntities: Map<string, Entity> = new Map();

    /**
     * Map of all asteroid entities by asteroid ID.
     * Used for collision detection and ECS management.
     * @private
     */
    private asteroidEntities: Map<string, Entity> = new Map();

    /**
     * Map of all pickup entities by pickup ID.
     * Used for pickup collection and ECS management.
     * @private
     */
    private pickupEntities: Map<string, Entity> = new Map();

    /**
     * Map of all projectile entities by projectile ID.
     * Used for projectile management and ECS updates.
     * @private
     */
    private projectileEntities: Map<string, Entity> = new Map();

    // ECS System Components

    /**
     * Entity-Component-System manager for coordinating entities and systems.
     * Created in setupECS().
     * @public
     */
    public entityManager!: EntityManager;

    /**
     * System handling keyboard input for the local player.
     * @private
     */
    private inputSystem!: InputSystem;

    /**
     * System handling physics-based movement for all entities.
     * @private
     */
    private movementSystem!: MovementSystem;

    /**
     * System handling weapon firing and bullet lifecycle for all players.
     * @private
     */
    private weaponSystem!: WeaponSystem;

    /**
     * System handling weapon visual upgrades based on player level.
     * @private
     */
    private weaponUpgradeSystem!: WeaponUpgradeSystem;

    /**
     * System handling UI text updates and rendering.
     * @private
     */
    private renderSystem!: RenderSystem;

    /**
     * System handling asteroid behavior, movement, and destruction.
     * @private
     */
    private asteroidSystem!: AsteroidSystem;

    /**
     * System handling player visuals, state, and lifecycle.
     * @private
     */
    private playerSystem!: PlayerSystem;

    /**
     * System handling pickup animations and logic.
     * @private
     */
    private pickupSystem!: PickupSystem;

    /**
     * System handling projectile animations and logic.
     * @private
     */
    private projectileSystem!: ProjectileSystem;

    /**
     * System handling player score and HUD updates.
     * @private
     */
    private scoreSystem!: ScoreSystem;

    /**
     * Creates the GameScene with key 'GameScene'.
     * Called by Phaser when the scene is constructed.
     */
    constructor() {
        super({ key: 'GameScene' });
    }

    /**
     * Initializes the game scene: ECS systems, world, socket listeners, and input.
     *
     * Sets up the complete game environment and waits for the player to enter
     * their name via the Vue.js modal before authenticating with the server.
     * Called automatically by Phaser after the scene is started.
     */
    public create(): void {
        // Get socket from registry
        this.socket = this.registry.get('socket') as Socket;

        // Setup ECS
        this.setupECS();

        // Setup world
        this.createWorld();

        // Wait for player name from Vue modal
        window.addEventListener(
            'playerNameSubmitted',
            ((event: CustomEvent) => {
                const playerName = event.detail.name || `Player ${Math.floor(Math.random() * 1000)}`;
                const dto = new SignOnDTO(playerName as string, this.scale.width, this.scale.height);
                this.socket.emit(Events.Player.authenticate, { ok: true, dto });
                createFeatureListeners({ socket: this.socket, scene: this });
            }) as EventListener,
            { once: true }
        );
    }

    /**
     * Initializes the Entity-Component-System architecture.
     *
     * Creates the EntityManager and all game systems (input, movement, weapons,
     * upgrades, render, asteroids, players, pickups, score), then registers systems with the manager for coordinated updates.
     * Called from create().
     * @private
     */
    private setupECS(): void {
        // Create entity manager
        this.entityManager = new EntityManager(this);

        // Create systems
        this.inputSystem = new InputSystem(this);
        this.movementSystem = new MovementSystem(this);
        this.weaponSystem = new WeaponSystem(this);
        this.weaponUpgradeSystem = new WeaponUpgradeSystem(this);
        this.renderSystem = new RenderSystem(this);
        this.asteroidSystem = new AsteroidSystem(this);
        this.playerSystem = new PlayerSystem(this);
        this.pickupSystem = new PickupSystem(this);
        this.scoreSystem = new ScoreSystem(this);

        // Register systems with entity manager
        this.entityManager.addSystem(this.inputSystem);
        this.entityManager.addSystem(this.movementSystem);
        this.entityManager.addSystem(this.weaponSystem);
        this.entityManager.addSystem(this.weaponUpgradeSystem);
        this.entityManager.addSystem(this.renderSystem);
        this.entityManager.addSystem(this.asteroidSystem);
        this.entityManager.addSystem(this.playerSystem);
        this.entityManager.addSystem(this.pickupSystem);
        this.entityManager.addSystem(this.scoreSystem);
    }

    /**
     * Creates the game world with background and physics bounds.
     *
     * Sets up a tiled space background and configures the physics world
     * to match the screen dimensions (1024x768).
     * @private
     */
    private createWorld(): void {
        // Add background
        this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'space').setOrigin(0, 0);
        // Setup world bounds
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    }

    /**
     * Main update loop called every frame by Phaser.
     *
     * Updates all ECS systems for entity processing, syncs local player state
     * to the server, handles collision detection, and emits player data to the Vue.js HUD.
     * All players are now managed by ECS systems.
     * @public
     */
    public update(): void {
        // Update ECS systems (handles input, movement, weapons, and UI for all entities)
        const delta = this.game.loop.delta;
        this.entityManager.update(delta);

        // Handle local player logic
        if (this.localPlayerId) {
            const localEntity = this.playerEntities.get(this.localPlayerId);

            if (!localEntity) {
                return;
            }

            const transform = localEntity.getComponent(TransformComponent)!;
            const weapon = localEntity.getComponent(WeaponComponent)!;

            // Emit player data to Vue HUD
            this.emitPlayerDataToVue();

            try {
                const { x, y } = transform.sprite;
                const request = { ok: true, dto: new CoordinatesDTO(x, y) };
                SocketRequestSchema.parse(request);
                this.socket.emit(Events.Player.coordinates, request);
            } catch (e) {
                const message = e instanceof Error ? e.message : e.toString();
                console.error(`[Client] Invalid SocketRequest for ${Events.Player.coordinates}: ${message}`);
                // Optionally show user feedback
            }

            this.detectCollisionWitAsteroids(transform, localEntity);
            this.detectCollisionWithPickups(transform, localEntity);
            this.detectCollisionWithProjectiles(weapon, localEntity);
        }
    }

    private detectCollisionWitAsteroids(transform: TransformComponent, localEntity: Entity): void {
        // Check asteroid collisions with local player
            this.asteroidEntities.forEach(asteroidEntity => {
                const asteroidTransform = asteroidEntity.getComponent(TransformComponent);
                if (!asteroidTransform || !asteroidTransform.sprite.active) {
                    return;
                }
                const distance = Phaser.Math.Distance.Between(transform.sprite.x, transform.sprite.y, asteroidTransform.sprite.x, asteroidTransform.sprite.y);
                if (distance < GameConfig.asteroid.collisionRadius) {// TODO implement ColliderComponent
                    // Player hit by asteroid - game over
                    const playerDTO = PlayerEntityFactory.toDTO(localEntity);
                    const hitRequest = { ok: true, dto: playerDTO };
                    try {
                        SocketRequestSchema.parse(hitRequest);
                        this.socket.emit(Events.Player.hit, hitRequest);
                        this.handlePlayerDeath(playerDTO); // TODO only on Events.Player.destroy
                    } catch (error: Error | unknown) {
                        return this.handleSocketError(Events.Player.hit, error);
                    }
                }
            });
    }

    private detectCollisionWithPickups(transform: TransformComponent, localEntity: Entity): void {
        // Check pickup collisions (support multiple pickups)
        for (const entity of this.getPickupEntities().values()) {
            const pickupTransform = entity.getComponent(TransformComponent);
            if (pickupTransform && pickupTransform.sprite.active) {
                // TODO: ColliderComponent => server side check
                const distance = Phaser.Math.Distance.Between(transform.sprite.x, transform.sprite.y, pickupTransform.sprite.x, pickupTransform.sprite.y);
                if (distance < GameConfig.pickup.collisionRadius) { // TODO: ColliderComponent => server side check
                    // Player collected the pickup: emit to server only, let server event handle removal
                    const pickupComp = entity.getComponent(PickupComponent);
                    const type = pickupComp?.type;
                    if (type === PickupType.COIN) {
                        this.playerSystem.handleCoinPickup(localEntity, entity, this);
                    } else if (type === PickupType.AMMO) {
                        this.playerSystem.handleAmmoPickup(localEntity, entity, this);
                    } else if (type === PickupType.HEALTH) {
                        this.playerSystem.handleHealthPickup(localEntity, entity, this);
                    }
                }
            }
        };
    }

    private detectCollisionWithProjectiles(weapon: WeaponComponent, localEntity: Entity): void {
        // Check projctiles collisions with asteroids
        if (this.projectileEntities.size > 0) {
            for (const asteroidEntity of this.asteroidEntities.values()) {
                
                const asteroidTransform = asteroidEntity.getComponent(TransformComponent);
                const asteroidComponent = asteroidEntity.getComponent(AsteroidComponent);
                
                if (!asteroidTransform || !asteroidTransform.sprite.active || !asteroidComponent) {
                    return;
                }
                
                for (const projectileEntity of this.projectileEntities.values()) {

                    const projectileTransform = projectileEntity.getComponent(TransformComponent);
                    
                    if (!projectileTransform?.sprite.active) {
                        continue;
                    }
                    
                    const distance = Phaser.Math.Distance.Between(
                        projectileTransform.sprite.x, 
                        projectileTransform.sprite.y, 
                        asteroidTransform.sprite.x, 
                        asteroidTransform.sprite.y
                    );

                    if (distance < GameConfig.asteroid.ammoCollisionRadius) {
                        // Projectile hit asteroid
                        projectileTransform.sprite.setActive(false);
                        projectileTransform.sprite.setVisible(false);
                        const damage = weapon.getDamage();
                        // Add score to local player for asteroid hit
                        const scoreComponent = localEntity.getComponent(ScoreComponent);
                        if (scoreComponent) {
                            scoreComponent.add(damage);
                        }
                        const request = { ok: true, dto: new AsteroidHitDTO(asteroidComponent.id, damage) };
                        this.socket.emit(Events.Asteroid.hit, request);
                        this.asteroidSystem.flashAsteroid(asteroidTransform.sprite);
                        // Exit loop after hit
                        return;
                    }
            }
            };
        }
    }

    /**
     * Emits a player pickup event to the server.
     * Used by PlayerSystem to avoid accessing private socket property directly.
     * @param request - The PickupDTO describing the pickup event
     * @public
     */
    public emitPlayerPickup(request: SocketResponseDTO<PickupDTO>): void {
        this.socket.emit(Events.Player.pickup, request);
    }

    /**
     * Emits a player shoot event to the server.
     * @param weaponDTO - The WeaponDTO describing the shoot event
     * @public
     */
    public emitPlayerShoot(weaponDTO: WeaponDTO): void {
        const entity = this.playerEntities.get(this.localPlayerId!);
        const playerDTO = PlayerEntityFactory.toDTO(entity!);
        const transform = entity!.getComponent(TransformComponent)!;
        playerDTO.angle = transform.sprite.rotation;
        this.socket.emit(Events.Player.shoot, { ok: true, dto: [playerDTO, weaponDTO.toJSON()] });
    }

    /**
     * Handles player death with game over screen and countdown.
     *
     * Displays "YOU DIED!" message with a 3-second countdown before
     * reloading the page to restart the game.
     *
     * @param player - The PlayerDTO for the player who died
     * @public
     */
    public handlePlayerDeath(player: PlayerDTO): void {
        // Play explosion at player's position, then pause so the player sees it
        const localEntity = this.playerEntities.get(player.id);
        let played = false;
        if (localEntity) {
            const transform = localEntity.getComponent(TransformComponent);
            if (transform && transform.sprite) {
                const explosion = this.add.sprite(transform.sprite.x, transform.sprite.y, 'kaboom');
                if (explosion.anims) {
                    explosion.play('explode');
                    explosion.once('animationcomplete', () => {
                        explosion.destroy();
                        played = true;
                        // After explosion completes, pause and notify server
                        this.scene.pause();
                        this.socket.emit(Events.Player.destroy, { ok: true, dto: player });
                        this.showDeathUI();
                    });
                } else {
                    explosion.destroy();
                }
            }
        }

        // Fallback: if no animation ran, pause after short delay and emit
        setTimeout(() => {
            if (!played) {
                this.scene.pause();
                this.socket.emit(Events.Player.destroy, { ok: true, dto: player });
                this.showDeathUI();
            }
        }, 600);

        setTimeout(() => window.location.reload(), 3000);
    }

    /**
     * Shows death UI and reload countdown. Extracted to allow reuse after explosion.
     * @private
     */
    private showDeathUI(): void {
        // TODO: Display "YOU DIED!" message using HUD/UI system
        this.add
            .text(this.scale.width / 2, this.scale.height / 2, 'YOU DIED!', {
                fontSize: '64px',
                color: '#ff0000',
            })
            .setOrigin(0.5);

        const countdownText = this.add
            .text(this.scale.width / 2, this.scale.height / 2 + 60, 'Reloading in 3 seconds...', {
                fontSize: '24px',
                color: '#ffffff',
            })
            .setOrigin(0.5);

        let countdown = 3;
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                countdownText.setText(`Reloading in ${countdown} second${countdown !== 1 ? 's' : ''}...`);
            } else {
                clearInterval(countdownInterval);
            }
        }, 1000);

        setTimeout(() => window.location.reload(), 3000);
    }

    /**
     * Removes and destroys a pickup entity by its ID.
     *
     * Destroys the pickup's sprite, removes the entity from the ECS, and deletes it from the pickupEntities map.
     *
     * @param id - The pickup entity ID
     * @public
     */
    public destroyPickupEntity(id: string): void {
        const entities = this.getPickupEntities();
        const entity = entities.get(id);
        if (!entity) {
            console.warn(`[GameScene] Tried to destroy missing pickup entity with id: ${id}`);
            return;
        }
        const transform = entity.getComponent(TransformComponent);
        if (transform) {
            transform.sprite.destroy();
        }
        this.entityManager.removeEntity(entity.id);
        entities.delete(id);
    }

        /**
     * Removes and destroys a pickup entity by its ID.
     *
     * Destroys the pickup's sprite, removes the entity from the ECS, and deletes it from the pickupEntities map.
     *
     * @param id - The pickup entity ID
     * @public
     */
    public destroyProjectileEntity(id: string): void {
        const entity = this.projectileEntities.get(id);
        if (!entity) {
            return;
        }
        const transform = entity.getComponent(TransformComponent);
        if (transform) {
            transform.sprite.destroy();
        }
        this.entityManager.removeEntity(entity.id);
        this.projectileEntities.delete(id);
    }

    /**
     * Gets the local player ID for HUD updates.
     * @returns The local player ID or null if not set
     * @public
     */
    public getLocalPlayerId(): string | null {
        return this.localPlayerId;
    }

    /**
     * Sets the local player ID for HUD updates.
     * @param id The local player ID
     * @public
     */
    public setLocalPlayerId(id: string | null): void {
        this.localPlayerId = id;
    }

    /**
     * Gets the map of player entities.
     * @returns Map of player entities by player ID
     * @public
     */
    public getPlayerEntities(): Map<string, Entity> {
        return this.playerEntities;
    }

    /**
     * Gets the PlayerSystem instance.
     * @returns The PlayerSystem instance
     * @public
     */
    public getPlayerSystem(): PlayerSystem {
        return this.playerSystem;
    }

    /**
     * Gets the map of asteroid entities.
     * @returns Map of asteroid entities by asteroid ID
     * @public
     */
    public getAsteroidEntities(): Map<string, Entity> {
        return this.asteroidEntities;
    }

    /**
     * Gets the AsteroidSystem instance.
     * @returns The AsteroidSystem instance
     * @public
     */
    public getAsteroidSystem(): AsteroidSystem {
        return this.asteroidSystem;
    }

    /**
     * Gets the map of pickup entities.
     * @returns Map of pickup entities by pickup ID
     * @public
     */
    public getPickupEntities(): Map<string, Entity> {
        return this.pickupEntities;
    }

    /**
     * Gets the ProjectileSystem instance.
     * @returns The ProjectileSystem instance
     * @public
     */
    public getProjectileSystem(): ProjectileSystem {
        return this.projectileSystem;
    }

    /**
     * Gets the map of projectile entities.
     * @returns - Map of projectile entities by projectile ID
     * @public
     */
    public getProjectileEntities(): Map<string, Entity> {
        return this.projectileEntities;
    }

    /**
     * Emits player data to Vue.js HUD for display.
     *
     * Sends custom events with current player stats (name, level, ammo, score)
     * to be consumed by the Vue frontend components.
     * @private
     */
    private emitPlayerDataToVue(): void {
        if (!this.localPlayerId) {
            return;
        }

        const entity = this.playerEntities.get(this.localPlayerId);
        if (!entity) {
            return;
        }

        const player = entity.getComponent(PlayerComponent);
        const weapon = entity.getComponent(WeaponComponent)!;

        // TODO ask the current level from the UpgradesComponent
        // TODO add health indicator

        if (!player || !weapon) {
            return;
        }

        // Get score from ScoreComponent if present
        let score = 0;
        const scoreComponent = entity.getComponent(ScoreComponent);
        if (scoreComponent) {
            score = scoreComponent.score ?? 0;
        }

        window.dispatchEvent(
            new CustomEvent('updatePlayerData', {
                detail: {
                    name: player.name,
                    level: player.level,
                    ammo: weapon.getAmmo(),
                    score,
                },
            })
        );
    }

    /**
     * Handles socket errors by logging and optionally showing user feedback.
     *
     * @param event The socket event where the error occurred
     * @param error The error object or message
     * @public
     */
    public handleSocketError(event: string, error: Error | unknown): void {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Client] Socket error on event ${event}: ${message}`);
        // TODO show user friendly message in the UI
    }
}
