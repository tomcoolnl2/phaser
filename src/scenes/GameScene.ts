import Phaser from 'phaser';
import { Socket } from 'socket.io-client';
import { PlayerEvent, GameEvent, AsteroidEvent } from '@shared/events';
import { SpaceShip, Coordinates, Player as PlayerData, Level } from '@shared/model';
import { PickupDTO } from '@shared/dto/PickupDTO';
import { AsteroidDTO } from '@shared/dto/AsteroidDTO';
import { GameConfig } from '@shared/config';
import { EntityManager } from '@/ecs/core/EntityManager';
import { InputSystem } from '@/ecs/systems/InputSystem';
import { MovementSystem } from '@/ecs/systems/MovementSystem';
import { WeaponSystem } from '@/ecs/systems/WeaponSystem';
import { WeaponUpgradeSystem } from '@/ecs/systems/WeaponUpgradeSystem';
import { RenderSystem } from '@/ecs/systems/RenderSystem';
import { AsteroidSystem } from '@/ecs/systems/AsteroidSystem';
import { PickupSystem } from '@/ecs/systems/PickupSystem';
import { createPlayerEntity, createAsteroidEntity, createPickupEntity } from '@/ecs/core/factories';
import { Entity } from '@/ecs/core/Entity';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { MovementComponent } from '@/ecs/components/MovementComponent';
import { HealthComponent } from '@/ecs/components/HealthComponent';
import { AsteroidComponent } from '@/ecs/components/AsteroidComponent';
import { PickupType } from '@/ecs/types/PickupType';

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
            if (!localEntity) return;

            const transform = localEntity.getComponent(TransformComponent)!;
            const weapon = localEntity.getComponent(WeaponComponent);
            const movement = localEntity.getComponent(MovementComponent)!;
            const playerComp = localEntity.getComponent(PlayerComponent)!;

            // Emit player data to Vue HUD
            this.emitPlayerDataToVue();

            // Send player state to server
            this.socket.emit(PlayerEvent.coordinates, {
                x: transform.sprite.x,
                y: transform.sprite.y,
                r: transform.sprite.rotation,
                f: weapon?.triggerPulled || false,
                m: movement.thrustInput !== 0,
                a: weapon?.ammo || 0,
            });

            // Check pickup collision
            if (this.pickupEntity) {
                const pickupTransform = this.pickupEntity.getComponent(TransformComponent);
                if (pickupTransform && pickupTransform.sprite.active) {
                    const distance = Phaser.Math.Distance.Between(transform.sprite.x, transform.sprite.y, pickupTransform.sprite.x, pickupTransform.sprite.y);

                    if (distance < GameConfig.pickup.collisionRadius) {
                        // Player collected the pickup
                        if (weapon) {
                            weapon.addAmmo(GameConfig.player.ammoPerPickup);
                        }

                        // Level up (cycle through 1-5)
                        const newLevel = ((playerComp.level % 5) + 1) as Level;
                        console.log(`[GameScene] Leveling up: ${playerComp.level} -> ${newLevel}`);
                        playerComp.setLevel(newLevel);

                        this.socket.emit(PlayerEvent.pickup, {
                            uuid: this.localPlayerId,
                            ammo: true,
                        });

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
                if (!asteroidTransform || !asteroidTransform.sprite.active) return;

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
                    const asteroidComp = asteroidEntity.getComponent(AsteroidComponent);
                    if (!asteroidTransform || !asteroidTransform.sprite.active || !asteroidComp) return;

                    weapon.bullets.children.entries.forEach((bullet: any) => {
                        if (bullet.active) {
                            const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, asteroidTransform.sprite.x, asteroidTransform.sprite.y);

                            if (distance < GameConfig.asteroid.bulletCollisionRadius) {
                                // Bullet hit asteroid
                                bullet.setActive(false);
                                bullet.setVisible(false);
                                this.socket.emit(AsteroidEvent.hit, asteroidComp.asteroidId);
                                // Flash effect
                                this.asteroidSystem.flashAsteroid(asteroidTransform.sprite);
                            }
                        }
                    });
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
        this.socket.on(PlayerEvent.joined, (playerData: SpaceShip) => {
            console.log('[Client]', 'Player joined:', playerData);
            const entity = createPlayerEntity(this, this.entityManager, playerData, 'shooter-sprite-enemy', false);
            this.playerEntities.set(playerData.id, entity);
        });

        // Local player (protagonist)
        this.socket.on(PlayerEvent.protagonist, (playerData: SpaceShip) => {
            console.log('[Client]', 'Local player:', playerData);
            const entity = createPlayerEntity(this, this.entityManager, playerData, 'shooter-sprite', true);
            this.playerEntities.set(playerData.id, entity);
            this.localPlayerId = playerData.id;
        });

        // Existing players
        this.socket.on(PlayerEvent.players, (players: SpaceShip[]) => {
            console.log('[Client]', 'Existing players:', players);
            players.forEach(playerData => {
                const entity = createPlayerEntity(this, this.entityManager, playerData, 'shooter-sprite-enemy', false);
                this.playerEntities.set(playerData.id, entity);
            });
        });

        // Player quit
        this.socket.on(PlayerEvent.quit, (playerId: string) => {
            console.log('[Client]', 'Player quit:', playerId);
            const entity = this.playerEntities.get(playerId);
            if (entity) {
                this.entityManager.removeEntity(entity.id);
                this.playerEntities.delete(playerId);
            }
        });

        // Player coordinates update
        this.socket.on(PlayerEvent.coordinates, (data: PlayerData) => {
            if (!data.player || !data.coors) return;

            // Skip local player (we control them locally)
            if (data.player.id === this.localPlayerId) return;

            const entity = this.playerEntities.get(data.player.id);
            if (entity) {
                const transform = entity.getComponent(TransformComponent);
                const weapon = entity.getComponent(WeaponComponent);

                if (transform) {
                    transform.sprite.setPosition(data.coors.x, data.coors.y);
                    transform.sprite.setRotation(data.coors.r);
                }

                if (weapon && data.coors.a !== undefined) {
                    weapon.ammo = data.coors.a;
                }

                // TODO: Add visual feedback for thrust (m) and firing (f) if needed
            }
        });

        // Player hit
        this.socket.on(PlayerEvent.hit, (playerId: string) => {
            console.log('[Client]', 'Player hit:', playerId);
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
        this.socket.on(GameEvent.drop, (coords: Coordinates) => {
            console.log('[Client]', 'Pickup dropped:', coords);
            if (this.pickupEntity) {
                const transform = this.pickupEntity.getComponent(TransformComponent);
                if (transform) {
                    transform.sprite.destroy();
                }
                this.entityManager.removeEntity(this.pickupEntity.id);
            }
            this.pickupEntity = createPickupEntity(this, this.entityManager, coords.x, coords.y, PickupType.AMMO, 10);
        });

        // Player pickup
        this.socket.on(PlayerEvent.pickup, (pickupDTO: PickupDTO) => {
            console.log('[Client]', 'Player picked up:', pickupDTO);
            const entity = this.playerEntities.get(pickupDTO.uuid);
            if (entity) {
                const weapon = entity.getComponent(WeaponComponent);
                if (weapon) {
                    weapon.addAmmo(10);
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
            console.log('[Client]', 'Asteroid created:', asteroidDTO);
            const entity = createAsteroidEntity(this, this.entityManager, asteroidDTO.id, asteroidDTO.x, asteroidDTO.y);
            // Set HP and maxHp if HealthComponent exists
            const health = entity.getComponent(HealthComponent);
            if (health) {
                health.currentHealth = asteroidDTO.hp;
                if (asteroidDTO.maxHp !== undefined) health.maxHealth = asteroidDTO.maxHp;
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
                    health.currentHealth = asteroidDTO.hp;
                    if (asteroidDTO.maxHp !== undefined) health.maxHealth = asteroidDTO.maxHp;
                }
            }
        });

        // Asteroid hit
        this.socket.on(AsteroidEvent.hit, (asteroidDTO: AsteroidDTO) => {
            console.log('[Client]', 'Asteroid hit', asteroidDTO);
            const entity = this.asteroidEntities.get(asteroidDTO.id);
            if (entity) {
                const health = entity.getComponent(HealthComponent);
                if (health) {
                    health.currentHealth = asteroidDTO.hp;
                    if (asteroidDTO.maxHp !== undefined) health.maxHealth = asteroidDTO.maxHp;
                }
                const transform = entity.getComponent(TransformComponent);
                if (transform) {
                    this.asteroidSystem.flashAsteroid(transform.sprite);
                }
            }
        });

        // Asteroid destroyed
        this.socket.on(AsteroidEvent.destroy, (asteroidDTO: AsteroidDTO) => {
            console.log('[Client]', 'Asteroid destroyed', asteroidDTO.id, asteroidDTO);
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

        const playerComp = entity.getComponent(PlayerComponent);
        const weapon = entity.getComponent(WeaponComponent);

        if (!playerComp) {
            return;
        }

        window.dispatchEvent(
            new CustomEvent('updatePlayerData', {
                detail: {
                    name: playerComp.playerName,
                    level: playerComp.level,
                    ammo: weapon?.ammo || 0,
                    score: 0, // TODO: Add score tracking
                },
            })
        );
    }
}
