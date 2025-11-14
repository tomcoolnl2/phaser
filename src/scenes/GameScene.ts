import Phaser from 'phaser';
import { v4 as uuidv4 } from 'uuid';
import { Socket } from 'socket.io-client';
import { PlayerEvent, GameEvent, AsteroidEvent } from '@shared/events';
import { Coordinates, Player as PlayerData, PlayerLevel } from '@shared/model';
import { AmmoPickupDTO, PickupDTO, PickupType } from '@shared/dto/PickupDTO';
import { AsteroidDTO, AsteroidHitDTO } from '@shared/dto/AsteroidDTO';
import { GameConfig } from '@shared/config';
import { EntityManager } from '@/ecs/core/EntityManager';
import { InputSystem } from '@/ecs/systems/InputSystem';
import { MovementSystem } from '@/ecs/systems/MovementSystem';
import { WeaponSystem } from '@/ecs/systems/WeaponSystem';
import { WeaponUpgradeSystem } from '@/ecs/systems/WeaponUpgradeSystem';
import { RenderSystem } from '@/ecs/systems/RenderSystem';
import { AsteroidSystem } from '@/ecs/systems/AsteroidSystem';
import { PickupSystem } from '@/ecs/systems/PickupSystem';
import { Entity } from '@/ecs/core/Entity';
import { AsteroidEntityFactory } from '@/ecs/factories/AsteroidEntityFactory';
import { PickupEntityFactory } from '@/ecs/factories/PickupEntityFactory';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { MovementComponent } from '@/ecs/components/MovementComponent';
import { HealthComponent } from '@/ecs/components/HealthComponent';
import { AsteroidComponent } from '@/ecs/components/AsteroidComponent';
import { PlayerEntityFactory } from '@/ecs/factories/PlayerEntityFactory';
import { AmmoAmount } from '@shared/types';
import { PlayerDTO } from '@shared/dto/PlayerDTO';


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
    /** Current pickup entity (only one can exist at a time) */
    private pickupEntity: Entity | null = null;

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
    /** System handling pickup animations */
    private pickupSystem!: PickupSystem;

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
                this.socket.emit(
                    PlayerEvent.authenticate,
                    {
                        name: playerName,
                    },
                    {
                        x: this.scale.width,
                        y: this.scale.height,
                    }
                );
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
        this.pickupSystem = new PickupSystem(this);

        // Register systems with entity manager
        this.entityManager.addSystem(this.inputSystem);
        this.entityManager.addSystem(this.movementSystem);
        this.entityManager.addSystem(this.weaponSystem);
        this.entityManager.addSystem(this.weaponUpgradeSystem);
        this.entityManager.addSystem(this.renderSystem);
        this.entityManager.addSystem(this.asteroidSystem);
        this.entityManager.addSystem(this.pickupSystem);
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
            const movement = localEntity.getComponent(MovementComponent)!;
            const player = localEntity.getComponent(PlayerComponent)!;

            // Emit player data to Vue HUD
            this.emitPlayerDataToVue();

            // Send player state to server
            this.socket.emit(PlayerEvent.coordinates, {
                x: transform.sprite.x,
                y: transform.sprite.y,
                r: transform.sprite.rotation,
                f: weapon.triggerPulled,
                m: movement.thrustInput !== 0,
                a: weapon.dto.ammo,
            });

            // Check pickup collision
            if (this.pickupEntity) {
                const pickupTransform = this.pickupEntity.getComponent(TransformComponent);
                if (pickupTransform && pickupTransform.sprite.active) {
                    const distance = Phaser.Math.Distance.Between(transform.sprite.x, transform.sprite.y, pickupTransform.sprite.x, pickupTransform.sprite.y);

                    if (distance < GameConfig.pickup.collisionRadius) {
                        // Player collected the pickup
                        if (weapon) {
                            weapon.addAmmo();
                        }

                        // Level up (cycle through 1-5)
                        const newLevel = ((player.level % 5) + 1) as PlayerLevel;
                        console.info(`[GameScene] Leveling up: ${player.level} -> ${newLevel}`);
                        player.level = newLevel;

                        // Update weapon damage based on new level
                        const scaledDamage = 1 + 0.5 * (newLevel - 1);
                        if (weapon) {
                            weapon.setDamage(scaledDamage);
                            console.info(`[GameScene] Weapon damage set to: ${scaledDamage}`);
                        }

                        this.socket.emit(PlayerEvent.pickup, {
                            type: PickupType.AMMO,
                            id: this.localPlayerId,
                            amount: AmmoAmount.BULLET_AMMO,
                        } as AmmoPickupDTO);

                        // Destroy pickup
                        pickupTransform.sprite.destroy();
                        this.entityManager.removeEntity(this.pickupEntity.id);
                        this.pickupEntity = null;
                    }
                }
            }

            // Check asteroid collisions with local player
            this.asteroidEntities.forEach(asteroidEntity => {
                const asteroidTransform = asteroidEntity.getComponent(TransformComponent);
                if (!asteroidTransform || !asteroidTransform.sprite.active) {
                    return;
                }

                const distance = Phaser.Math.Distance.Between(transform.sprite.x, transform.sprite.y, asteroidTransform.sprite.x, asteroidTransform.sprite.y);

                if (distance < GameConfig.asteroid.collisionRadius) {
                    // Player hit by asteroid - game over
                    this.socket.emit(PlayerEvent.hit, this.localPlayerId!);
                    this.handlePlayerDeath(this.localPlayerId!);
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

                        const distance = Phaser.Math.Distance.Between(
                            bullet.x,
                            bullet.y,
                            asteroidTransform.sprite.x,
                            asteroidTransform.sprite.y
                        );

                        if (distance < GameConfig.asteroid.ammoCollisionRadius) {
                            bullet.setActive(false);
                            bullet.setVisible(false);

                            this.socket.emit(AsteroidEvent.hit, {
                                asteroidId: asteroidComponent.id,
                                damage: weapon.getDamage()
                            });

                            this.asteroidSystem.flashAsteroid(asteroidTransform.sprite);
                        }
                    }
                });
            }
        }
    }

    /**
     * Handles player death with game over screen and countdown.
     *
     * Displays "YOU DIED!" message with a 3-second countdown before
     * reloading the page to restart the game.
     *
     * @param _playerId - The ID of the player who died (unused but kept for future extensions)
     */
    private handlePlayerDeath(_playerId: string): void {
        this.scene.pause();
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
        this.socket.on(PlayerEvent.joined, (playerDTO: PlayerDTO) => {
            console.info('[Client]', 'Player joined:', playerDTO);
            playerDTO.spriteKey = 'shooter-sprite-enemy';
            playerDTO.isLocal = false;
            const entity = new PlayerEntityFactory(this, this.entityManager).create(playerDTO);
            this.playerEntities.set(playerDTO.id, entity);
        });

        // Local player (protagonist)
        this.socket.on(PlayerEvent.protagonist, (playerDTO: PlayerDTO) => {
            console.info('[Client]', 'Local player:', playerDTO);
            playerDTO.spriteKey = 'shooter-sprite';
            playerDTO.isLocal = true;
            const entity = new PlayerEntityFactory(this, this.entityManager).create(playerDTO);
            this.playerEntities.set(playerDTO.id, entity);
            this.localPlayerId = playerDTO.id;
        });

        // Existing players
        this.socket.on(PlayerEvent.players, (players: PlayerDTO[]) => {
            console.info('[Client]', 'Existing players:', players);
            players.forEach(playerDTO => {
                playerDTO.spriteKey = 'shooter-sprite-enemy';
                playerDTO.isLocal = false;
                const entity = new PlayerEntityFactory(this, this.entityManager).create(playerDTO);
                this.playerEntities.set(playerDTO.id, entity);
            });
        });

        // Player quit
        this.socket.on(PlayerEvent.quit, (playerId: string) => {
            console.info('[Client]', 'Player quit:', playerId);
            const entity = this.playerEntities.get(playerId);
            if (entity) {
                this.entityManager.removeEntity(entity.id);
                this.playerEntities.delete(playerId);
            }
        });

        // Player coordinates update
        this.socket.on(PlayerEvent.coordinates, (playerData: PlayerData) => {
            if (!playerData.player || !playerData.coors) {
                return;
            }

            // Skip local player (we control them locally)
            if (playerData.player.id === this.localPlayerId) {
                return;
            }

            const entity = this.playerEntities.get(playerData.player.id);
            if (entity) {
                const transform = entity.getComponent(TransformComponent);

                if (transform) {
                    transform.sprite.setPosition(playerData.coors.x, playerData.coors.y);
                    transform.sprite.setRotation(playerData.coors.r);
                }

                // TODO: Add visual feedback for thrust (m) and firing (f) if needed
            }
        });

        // Player hit
        this.socket.on(PlayerEvent.hit, (playerId: string) => {
            console.info('[Client]', 'Player hit:', playerId);
            const entity = this.playerEntities.get(playerId);
            if (entity) {
                if (playerId === this.localPlayerId) {
                    // Game over for local player
                    this.scene.pause();
                    this.add
                        .text(this.scale.width / 2, this.scale.height / 2, 'YOU DIED!', {
                            fontSize: '64px',
                            color: '#ff0000',
                        })
                        .setOrigin(0.5);
                    setTimeout(() => window.location.reload(), 3000);
                } else {
                    // Remote player died
                    this.entityManager.removeEntity(entity.id);
                    this.playerEntities.delete(playerId);
                }
            }
        });

        // Pickup drop
        this.socket.on(GameEvent.drop, ({ x, y }: Coordinates) => {
            console.info('[Client]', 'Pickup dropped:', { x, y });
            if (this.pickupEntity) {
                const transform = this.pickupEntity.getComponent(TransformComponent);
                if (transform) {
                    transform.sprite.destroy();
                }
                this.entityManager.removeEntity(this.pickupEntity.id);
            }
            const dto: PickupDTO = {
                type: PickupType.AMMO,
                amount: AmmoAmount.BULLET_AMMO,
                x,
                y,
                id: uuidv4(),
            };
            this.pickupEntity = new PickupEntityFactory(this, this.entityManager).create(dto);
        });

        // Player pickup
        this.socket.on(PlayerEvent.pickup, (pickupDTO: PickupDTO) => {
            console.info('[Client]', 'Player picked up:', pickupDTO);
            const entity = this.playerEntities.get(pickupDTO.id);
            if (entity) {
                switch (pickupDTO.type) {
                    case PickupType.AMMO:
                        const weapon = entity.getComponent(WeaponComponent);
                        if (weapon) {
                            weapon.addAmmo();
                        }
                        break;
                    case PickupType.HEALTH:
                        const health = entity.getComponent(HealthComponent);
                        if (health) {
                            health.currentHealth = Math.min(health.maxHealth, health.currentHealth + pickupDTO.amount);
                        }
                        break;
                    default:
                        break;
                }
            }
            if (this.pickupEntity) {
                // Remove entity first to trigger cleanup in systems
                this.entityManager.removeEntity(this.pickupEntity.id);

                // Then destroy the sprite
                const transform = this.pickupEntity.getComponent(TransformComponent);
                if (transform) {
                    transform.sprite.destroy();
                }

                this.pickupEntity = null;
            }
        });

        // Asteroid created
        this.socket.on(AsteroidEvent.create, (asteroidDTO: AsteroidDTO) => {
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
        });

        // Asteroid coordinates
        this.socket.on(AsteroidEvent.coordinates, (asteroidDTO: AsteroidDTO) => {
            const entity = this.asteroidEntities.get(asteroidDTO.id);
            if (entity) {
                const transform = entity.getComponent(TransformComponent);
                if (transform) {
                    transform.sprite.setPosition(asteroidDTO.x, asteroidDTO.y);
                }
                const health = entity.getComponent(HealthComponent);
                if (health) {
                    health.currentHealth = asteroidDTO.health;
                    if (asteroidDTO.maxHealth !== undefined) health.maxHealth = asteroidDTO.maxHealth;
                }
            }
        });

        // Asteroid hit
        this.socket.on(AsteroidEvent.hit, ({ asteroidId, damage }: AsteroidHitDTO) => {
            console.info('[Client]', 'Asteroid hit', asteroidId, 'damage:', damage);
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
        });

        // Asteroid destroyed
        this.socket.on(AsteroidEvent.destroy, (asteroidDTO: AsteroidDTO) => {
            console.info('[Client]', 'Asteroid destroyed', asteroidDTO.id, asteroidDTO);
            this.asteroidSystem.destroyAsteroidById(asteroidDTO.id);
            this.asteroidEntities.delete(asteroidDTO.id);
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

        if (!player) {
            return;
        }

        window.dispatchEvent(
            new CustomEvent('updatePlayerData', {
                detail: {
                    name: player.playerName,
                    level: player.level,
                    ammo: weapon.getAmmo(),
                    score: 0, // TODO: Add score tracking
                },
            })
        );
    }
}
