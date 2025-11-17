import { ScoreSystem } from '@/ecs/systems/ScoreSystem';
import Phaser from 'phaser';
import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { GameConfig } from '@shared/config';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { PickupDTO, PickupType } from '@shared/dto/Pickup.dto';
import { AsteroidDTO, AsteroidHitDTO } from '@shared/dto/Asteroid.dto';
import { SocketResponseDTO } from '@shared/dto/SocketResponse.dto';
import { SocketResponseSchema, SocketRequestSchema } from '@shared/dto/Socket.schema';
import { EntityManager } from '@/ecs/core/EntityManager';
import { InputSystem } from '@/ecs/systems/InputSystem';
import { MovementSystem } from '@/ecs/systems/MovementSystem';
import { WeaponSystem } from '@/ecs/systems/WeaponSystem';
import { WeaponUpgradeSystem } from '@/ecs/systems/WeaponUpgradeSystem';
import { RenderSystem } from '@/ecs/systems/RenderSystem';
import { AsteroidSystem } from '@/ecs/systems/AsteroidSystem';
import { PickupSystem } from '@/ecs/systems/PickupSystem';
import { PlayerSystem } from '@/ecs/systems/PlayerSystem';
import { Entity } from '@/ecs/core/Entity';
import { AsteroidEntityFactory } from '@/ecs/factories/AsteroidEntityFactory';
import { PickupEntityFactory } from '@/ecs/factories/PickupEntityFactory';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { ScoreComponent } from '@/ecs/components/ScoreComponent';
import { PickupComponent } from '@/ecs/components/PickupComponent';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { HealthComponent } from '@/ecs/components/HealthComponent';
import { AsteroidComponent } from '@/ecs/components/AsteroidComponent';
import { PlayerEntityFactory } from '@/ecs/factories/PlayerEntityFactory';

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
    /** Socket.IO connection for multiplayer networking */
    private socket!: Socket;
    /** Map of player entities by player ID */
    private playerEntities: Map<string, Entity> = new Map();
    /** Reference to the local player entity ID */
    private localPlayerId: string | null = null;
    /** Map of all asteroid entities by asteroid ID */
    private asteroidEntities: Map<string, Entity> = new Map();
    /** Map of all pickup entities by pickup ID */
    private pickupEntities: Map<string, Entity> = new Map();

    // ECS System Components
    /** Entity-Component-System manager for coordinating entities and systems */
    public entityManager!: EntityManager;
    /** System handling keyboard input for the local player */
    private inputSystem!: InputSystem;
    /** System handling physics-based movement */
    private movementSystem!: MovementSystem;
    /** System handling weapon firing and bullet lifecycle */
    private weaponSystem!: WeaponSystem;
    /** System handling weapon visual upgrades based on level */
    private weaponUpgradeSystem!: WeaponUpgradeSystem;
    /** System handling UI text updates */
    private renderSystem!: RenderSystem;
    /** System handling asteroid behavior and destruction */
    private asteroidSystem!: AsteroidSystem;
    /** System handling player visuals and lifecycle */
    private playerSystem!: PlayerSystem;
    /** System handling pickup animations */
    private pickupSystem!: PickupSystem;

    /** System handling player score and HUD updates */
    private scoreSystem!: ScoreSystem;

    /**
     * Creates the GameScene with key 'GameScene'.
     */
    constructor() {
        super({ key: 'GameScene' });
    }

    /**
     * Initializes the game scene: ECS systems, world, socket listeners, and input.
     *
     * Sets up the complete game environment and waits for the player to enter
     * their name via the Vue.js modal before authenticating with the server.
     */
    public create(): void {
        // Get socket from registry
        this.socket = this.registry.get('socket') as Socket;

        // Setup ECS
        this.setupECS();

        // Setup world
        this.createWorld();

        // Setup socket listeners
        this.setupSocketListeners();

        // Wait for player name from Vue modal
        window.addEventListener(
            'playerNameSubmitted',
            ((event: CustomEvent) => {
                const playerName = event.detail.name || `Player ${Math.floor(Math.random() * 1000)}`;
                const signonDto = { name: playerName as string, x: this.scale.width, y: this.scale.height };
                this.socket.emit(Events.Player.authenticate, { ok: true, dto: signonDto });
            }) as EventListener,
            { once: true }
        );
    }

    /**
     * Initializes the Entity-Component-System architecture.
     *
     * Creates the EntityManager and all game systems (input, movement, weapons,
     * upgrades, render), then registers systems with the manager for coordinated updates.
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

        // Score system for player score and HUD
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
     * Main update loop called every frame.
     *
     * Updates all ECS systems for entity processing, syncs local player state
     * to the server, handles collision detection, and emits player data to the Vue.js HUD.
     * All players are now managed by ECS systems.
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
                const request = { ok: true, dto: { x, y } };
                SocketRequestSchema.parse(request);
                this.socket.emit(Events.Player.coordinates, request);
            } catch (e) {
                const message = e instanceof Error ? e.message : e.toString();
                console.error(`[Client] Invalid SocketRequest for ${Events.Player.coordinates}: ${message}`);
                // Optionally show user feedback
            }

            // Check pickup collisions (support multiple pickups)
            this.pickupEntities.forEach((pickupEntity, pickupId) => {
                const pickupTransform = pickupEntity.getComponent(TransformComponent);
                if (pickupTransform && pickupTransform.sprite.active) {
                    const distance = Phaser.Math.Distance.Between(transform.sprite.x, transform.sprite.y, pickupTransform.sprite.x, pickupTransform.sprite.y);
                    if (distance < GameConfig.pickup.collisionRadius) {
                        // Player collected the pickup
                        const pickupComp = pickupEntity.getComponent(PickupComponent);
                        const type = pickupComp?.type;
                        if (type === PickupType.COIN) {
                            this.playerSystem.handleCoinPickup(localEntity, pickupEntity, this);
                        } else if (type === PickupType.AMMO) {
                            this.playerSystem.handleAmmoPickup(localEntity, pickupEntity, this);
                        } else if (type === PickupType.HEALTH) {
                            this.playerSystem.handleHealthPickup(localEntity, pickupEntity, this);
                        }
                        // Remove the pickup locally
                        this.destroyPickupEntity(pickupId);
                    }
                }
            });

            // Check asteroid collisions with local player
            this.asteroidEntities.forEach(asteroidEntity => {
                const asteroidTransform = asteroidEntity.getComponent(TransformComponent);
                if (!asteroidTransform || !asteroidTransform.sprite.active) {
                    return;
                }
                const distance = Phaser.Math.Distance.Between(transform.sprite.x, transform.sprite.y, asteroidTransform.sprite.x, asteroidTransform.sprite.y);
                if (distance < GameConfig.asteroid.collisionRadius) {
                    // Player hit by asteroid - game over
                    const playerDTO = PlayerEntityFactory.toDTO(localEntity);
                    const hitRequest = { ok: true, dto: playerDTO };
                    try {
                        SocketRequestSchema.parse(hitRequest);
                        this.socket.emit(Events.Player.hit, hitRequest);
                        this.handlePlayerDeath(playerDTO);
                    } catch (error: Error | unknown) {
                        return this.handleSocketError(Events.Player.hit, error);
                    }
                }
            });

            // Check bullet collisions with asteroids
            if (weapon && weapon.bullets) {
                this.asteroidEntities.forEach(asteroidEntity => {
                    const asteroidTransform = asteroidEntity.getComponent(TransformComponent);
                    const asteroidComponent = asteroidEntity.getComponent(AsteroidComponent);
                    if (!asteroidTransform || !asteroidTransform.sprite.active || !asteroidComponent) {
                        return;
                    }
                    const bullets = weapon.bullets.children.getArray() as Phaser.GameObjects.Sprite[];
                    for (const bullet of bullets) {
                        if (!bullet.active) {
                            continue;
                        }
                        const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, asteroidTransform.sprite.x, asteroidTransform.sprite.y);
                        if (distance < GameConfig.asteroid.ammoCollisionRadius) {
                            bullet.setActive(false);
                            bullet.setVisible(false);
                            const damage = weapon.getDamage();
                            // Add score to local player for asteroid hit
                            const scoreComponent = localEntity.getComponent(ScoreComponent);
                            if (scoreComponent) {
                                scoreComponent.add(damage);
                            }
                            const asteroidHitDTO = { asteroidId: asteroidComponent.id, damage };
                            const hitRequest = { ok: true, dto: asteroidHitDTO };
                            try {
                                SocketRequestSchema.parse(hitRequest);
                                this.socket.emit(Events.Asteroid.hit, hitRequest);
                                this.asteroidSystem.flashAsteroid(asteroidTransform.sprite);
                            } catch (error: Error | unknown) {
                                return this.handleSocketError(Events.Asteroid.hit, error);
                            }
                        }
                    }
                });
            }
        }
    }

    /**
     * Emits a player pickup event to the server.
     * Used by PlayerSystem to avoid accessing private socket property directly.
     */
    public emitPlayerPickup(request: any): void {
        this.socket.emit(Events.Player.pickup, request);
    }

    /**
     * Handles player death with game over screen and countdown.
     *
     * Displays "YOU DIED!" message with a 3-second countdown before
     * reloading the page to restart the game.
     *
     * @param _playerId - The ID of the player who died (unused but kept for future extensions)
     */
    private handlePlayerDeath(player: PlayerDTO): void {
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

        // Countdown timer
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
     * Shows death UI and reload countdown. Extracted to allow reuse after explosion.
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
     * Creates the game world with background and physics bounds.
     *
     * Sets up a tiled space background and configures the physics world
     * to match the screen dimensions (1024x768).
     */
    private createWorld(): void {
        // Add background
        this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'space').setOrigin(0, 0);
        // Setup world bounds
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    }

    /**
     * Removes and destroys a pickup entity by its ID.
     * @param id - The pickup entity ID
     */
    public destroyPickupEntity(id: string): void {
        const pickupEntity = this.pickupEntities.get(id);
        if (!pickupEntity) return;
        const pickupTransform = pickupEntity.getComponent(TransformComponent);
        if (pickupTransform) {
            pickupTransform.sprite.destroy();
        }
        this.entityManager.removeEntity(pickupEntity.id);
        this.pickupEntities.delete(id);
    }

    /**
     * Registers all Socket.IO event listeners for multiplayer synchronization.
     *
     * Handles events for:
     * - Player joins/leaves
     * - Local player (protagonist) spawning
     * - Position updates for all players
     * - Player level updates
     * - Asteroid spawning/destruction
     * - Pickup spawning/collection
     */
    private setupSocketListeners(): void {
        // Player joined
        this.socket.on(Events.Player.joined, (response: SocketResponseDTO) => {
            try {
                SocketResponseSchema.parse(response);
                const playerDTO = response.dto as PlayerDTO;
                playerDTO.spriteKey = 'shooter-sprite-enemy';
                playerDTO.isLocal = false;
                const factory = new PlayerEntityFactory(this, this.entityManager);
                const entity = factory.fromDTO(playerDTO);
                this.playerEntities.set(playerDTO.id, entity);
                console.info('[Client]', 'Player joined:', playerDTO);
            } catch (error: Error | unknown) {
                return this.handleSocketError(Events.Player.joined, error);
            }
        });

        // Local player (protagonist)
        this.socket.on(Events.Player.protagonist, (response: SocketResponseDTO) => {
            try {
                SocketResponseSchema.parse(response);
                const playerDTO = response.dto as PlayerDTO;
                playerDTO.spriteKey = 'shooter-sprite';
                playerDTO.isLocal = true;
                const factory = new PlayerEntityFactory(this, this.entityManager);
                const entity = factory.fromDTO(playerDTO);
                this.playerEntities.set(playerDTO.id, entity);
                this.localPlayerId = playerDTO.id;
                console.info('[Client]', 'Local player:', playerDTO);
            } catch (error: Error | unknown) {
                return this.handleSocketError(Events.Player.protagonist, error);
            }
        });

        // Existing players
        this.socket.on(Events.Player.players, (response: SocketResponseDTO) => {
            try {
                SocketResponseSchema.parse(response);
                const players = response.dto as PlayerDTO[];
                const factory = new PlayerEntityFactory(this, this.entityManager);
                players.forEach(playerDTO => {
                    playerDTO.spriteKey = 'shooter-sprite-enemy';
                    playerDTO.isLocal = false;
                    const entity = factory.fromDTO(playerDTO);
                    this.playerEntities.set(playerDTO.id, entity);
                });
                console.info('[Client]', 'Existing players:', players);
            } catch (error: Error | unknown) {
                return this.handleSocketError(Events.Player.players, error);
            }
        });

        // Player quit
        this.socket.on(Events.Player.quit, (response: SocketResponseDTO<PlayerDTO>) => {
            try {
                SocketResponseSchema.parse(response);
                const player = response.dto as PlayerDTO;
                console.info('[Client]', 'Player quit:', player.id);
                const entity = this.playerEntities.get(player.id);
                if (entity) {
                    this.entityManager.removeEntity(entity.id);
                    this.playerEntities.delete(player.id);
                }
            } catch (error: Error | unknown) {
                return this.handleSocketError(Events.Player.quit, error);
            }
        });

        // Player coordinates update
        this.socket.on(Events.Player.coordinates, (response: SocketResponseDTO) => {
            try {
                SocketResponseSchema.parse(response);
                const playerDTO = response.dto as PlayerDTO;
                if (!playerDTO.id) {
                    throw new Error('PlayerDTO missing id');
                }
                // Skip local player (we control them locally)
                if (playerDTO.id === this.localPlayerId) {
                    return;
                }
                const entity = this.playerEntities.get(playerDTO.id);
                if (entity) {
                    const transform = entity.getComponent(TransformComponent);
                    if (transform) {
                        transform.sprite.setPosition(playerDTO.x, playerDTO.y);
                    }
                    // TODO: Add visual feedback for thrust (m) and firing (f) if needed
                }
            } catch (error: Error | unknown) {
                return this.handleSocketError(Events.Player.coordinates, error);
            }
        });

        // Player hit
        this.socket.on(Events.Player.hit, (response: SocketResponseDTO<PlayerDTO>) => {
            try {
                SocketResponseSchema.parse(response);
                const player = response.dto as PlayerDTO;
                console.info('[Client]', 'Player hit:', player);

                const entity = this.playerEntities.get(player.id)!;
                const health = entity.getComponent(HealthComponent)!;
                health.currentHealth = player.health;
                if (entity && health.currentHealth <= 0) {
                    if (player.id === this.localPlayerId) {
                        this.handlePlayerDeath(player);
                    } else {
                        // Remote player died - play death animation and cleanup via PlayerSystem
                        this.playerSystem.destroyPlayerById(player.id);
                        this.playerEntities.delete(player.id);
                    }
                }
            } catch (error: Error | unknown) {
                return this.handleSocketError(Events.Player.hit, error);
            }
        });

        this.socket.on(Events.Player.destroy, (response: SocketResponseDTO<PlayerDTO>) => {
            try {
                SocketResponseSchema.parse(response);
                const player = response.dto as PlayerDTO;
                console.info('[Client]', 'Player destroyed:', player.id);
                const entity = this.playerEntities.get(player.id);
                if (entity) {
                    this.playerSystem.destroyPlayerById(player.id);
                    this.playerEntities.delete(player.id);
                }
            } catch (error: Error | unknown) {
                return this.handleSocketError(Events.Player.destroy, error);
            }
        });

        // Pickup drop
        this.socket.on(Events.Game.drop, (response: SocketResponseDTO<PickupDTO>) => {
            try {
                SocketResponseSchema.parse(response);
                const dto = response.dto as PickupDTO;
                console.info('[Client] Pickup dropped:', dto);
                // If a pickup with this ID already exists, remove it first (shouldn't happen, but safe)
                if (this.pickupEntities.has(dto.id)) {
                    const existing = this.pickupEntities.get(dto.id);
                    if (existing) {
                        const transform = existing.getComponent(TransformComponent);
                        if (transform) {
                            transform.sprite.destroy();
                        }
                        this.entityManager.removeEntity(existing.id);
                    }
                }
                // Create and store the new pickup entity
                const pickupEntity = new PickupEntityFactory(this, this.entityManager).create(dto);
                this.pickupEntities.set(dto.id, pickupEntity);
            } catch (error: Error | unknown) {
                return this.handleSocketError(Events.Game.drop, error);
            }
        });

        // Player pickup
        this.socket.on(Events.Player.pickup, (response: SocketResponseDTO<PickupDTO>) => {
            try {
                SocketResponseSchema.parse(response);
                const pickupDTO = response.dto as PickupDTO;
                console.info('[Client]', 'Player picked up:', pickupDTO);
                // Remove the pickup entity with this ID
                this.destroyPickupEntity(pickupDTO.id);
                // (Optional) handle player entity update if needed
            } catch (error: Error | unknown) {
                return this.handleSocketError(Events.Player.pickup, error);
            }
        });

        // Asteroid created
        this.socket.on(Events.Asteroid.create, (response: SocketResponseDTO<AsteroidDTO>) => {
            try {
                SocketResponseSchema.parse(response);
                const asteroidDTO = response.dto as AsteroidDTO;
                console.info('[Client]', 'Asteroid created:', asteroidDTO);
                const entity = new AsteroidEntityFactory(this, this.entityManager).create(asteroidDTO);
                // Set HP and maxHp if HealthComponent exists
                const health = entity.getComponent(HealthComponent);
                if (health) {
                    health.currentHealth = asteroidDTO.health;
                    if (asteroidDTO.maxHealth !== undefined) {
                        health.maxHealth = asteroidDTO.maxHealth;
                    }
                }
                this.asteroidEntities.set(asteroidDTO.id, entity);
            } catch (error: Error | unknown) {
                return this.handleSocketError(Events.Asteroid.create, error);
            }
        });

        // Asteroid coordinates
        this.socket.on(Events.Asteroid.coordinates, (response: SocketResponseDTO<AsteroidDTO>) => {
            try {
                SocketResponseSchema.parse(response);
                const asteroidDTO = response.dto as AsteroidDTO;
                const entity = this.asteroidEntities.get(asteroidDTO.id);
                if (entity) {
                    const transform = entity.getComponent(TransformComponent);
                    if (transform) {
                        transform.sprite.setPosition(asteroidDTO.x, asteroidDTO.y);
                    }
                    const health = entity.getComponent(HealthComponent);
                    if (health) {
                        health.currentHealth = asteroidDTO.health;
                        if (asteroidDTO.maxHealth !== undefined) {
                            health.maxHealth = asteroidDTO.maxHealth;
                        }
                    }
                }
            } catch (error: Error | unknown) {
                return this.handleSocketError(Events.Asteroid.coordinates, error);
            }
        });

        // Asteroid hit
        this.socket.on(Events.Asteroid.hit, (response: SocketResponseDTO<AsteroidHitDTO>) => {
            try {
                SocketResponseSchema.parse(response);
                const { asteroidId, damage } = response.dto as AsteroidHitDTO;
                console.info('[Client] Asteroid hit', asteroidId, 'damage:', damage);
                if (typeof damage !== 'number' || isNaN(damage)) {
                    throw new Error(`Invalid damage value received for asteroid hit: ${damage}`);
                }
                const entity = this.asteroidEntities.get(asteroidId);
                if (entity) {
                    const health = entity.getComponent(HealthComponent);
                    if (health) {
                        health.currentHealth = Math.max(0, health.currentHealth - damage);
                    }
                    const transform = entity.getComponent(TransformComponent);
                    if (transform) {
                        this.asteroidSystem.flashAsteroid(transform.sprite);
                    }
                }
            } catch (error: Error | unknown) {
                return this.handleSocketError(Events.Asteroid.hit, error);
            }
        });

        // Asteroid destroyed
        this.socket.on(Events.Asteroid.destroy, (response: SocketResponseDTO<AsteroidDTO>) => {
            try {
                SocketResponseSchema.parse(response);
                const asteroidDTO = response.dto as AsteroidDTO;
                console.info('[Client] Asteroid destroyed:', asteroidDTO.id);
                this.asteroidSystem.destroyAsteroidById(asteroidDTO.id);
                this.asteroidEntities.delete(asteroidDTO.id);
            } catch (error: Error | unknown) {
                return this.handleSocketError(Events.Asteroid.destroy, error);
            }
        });
    }

    /**
     * Emits player data to Vue.js HUD for display.
     *
     * Sends custom events with current player stats (name, level, ammo, score)
     * to be consumed by the Vue frontend components.
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
     * @param event The socket event where the error occurred
     * @param error The error object or message
     */
    public handleSocketError(event: string, error: Error | unknown): void {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Client] Socket error on event ${event}: ${message}`);
        // TODO show user friendly message in the UI
    }
}
