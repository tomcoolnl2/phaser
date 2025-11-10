import Phaser from 'phaser';
import { Socket } from 'socket.io-client';
import { PlayerEvent, GameEvent, CometEvent } from '../../shared/events';
import { SpaceShip, Coordinates, Player as PlayerData, Comet, PickupData, Level } from '../../shared/models';
import { GameConfig } from '../../shared/config';
import { Player } from '../entities/Player';
import { Asteroid } from '../entities/Asteroid';
import { Pickup } from '../entities/Pickup';
import { EntityManager, InputSystem, MovementSystem, WeaponSystem, WeaponUpgradeSystem, createPlayerEntity, Entity, PlayerComponent } from '../ecs';

/**
 * Main gameplay scene that manages all game entities and ECS systems.
 * 
 * GameScene handles:
 * - Player spawning and management (local and remote players)
 * - ECS system integration (input, movement, weapons, upgrades)
 * - Asteroid spawning and collision detection
 * - Pickup item spawning and collection
 * - Socket.IO networking for multiplayer synchronization
 * - HUD updates via custom events to Vue.js frontend
 * 
 * The scene uses a hybrid approach:
 * - Local player uses ECS for input/movement/weapons
 * - Remote players use traditional OOP update loop
 * - Collision detection handled via Phaser's arcade physics
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
    /** Map of all player instances by player ID */
    private players: Map<string, Player> = new Map();
    /** Reference to the local player (controlled by this client) */
    private localPlayer: Player | null = null;
    /** Map of all asteroid instances by asteroid ID */
    private asteroids: Map<string, Asteroid> = new Map();
    /** Current pickup item (only one can exist at a time) */
    private pickup: Pickup | null = null;

    // ECS System Components
    /** Entity-Component-System manager for coordinating entities and systems */
    private entityManager!: EntityManager;
    /** System handling keyboard input for the local player */
    private inputSystem!: InputSystem;
    /** System handling physics-based movement */
    private movementSystem!: MovementSystem;
    /** System handling weapon firing and bullet lifecycle */
    private weaponSystem!: WeaponSystem;
    /** System handling weapon visual upgrades based on level */
    private weaponUpgradeSystem!: WeaponUpgradeSystem;
    /** Maps player ID to their ECS entity representation */
    private playerEntities: Map<string, Entity> = new Map();

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

        // Setup input
        this.setupInput();

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
     * upgrades), then registers systems with the manager for coordinated updates.
     */
    private setupECS(): void {
        // Create entity manager
        this.entityManager = new EntityManager(this);

        // Create systems
        this.inputSystem = new InputSystem(this);
        this.movementSystem = new MovementSystem(this);
        this.weaponSystem = new WeaponSystem(this);
        this.weaponUpgradeSystem = new WeaponUpgradeSystem(this);

        // Register systems with entity manager
        this.entityManager.addSystem(this.inputSystem);
        this.entityManager.addSystem(this.movementSystem);
        this.entityManager.addSystem(this.weaponSystem);
        this.entityManager.addSystem(this.weaponUpgradeSystem);
    }

    /**
     * Main update loop called every frame.
     * 
     * Updates all ECS systems for entity processing, syncs local player state
     * to the server, updates remote players, handles collision detection, and
     * emits player data to the Vue.js HUD.
     */
    public update(): void {
        // Update ECS systems (handles input, movement, and weapons for ECS entities)
        const delta = this.game.loop.delta;
        this.entityManager.update(delta);

        // Update local player
        if (this.localPlayer) {
            // Note: Player.update() is now handled by ECS systems
            // We just keep the network sync and collision detection here

            // Emit player data to Vue HUD
            this.emitPlayerDataToVue();

            // Send player state to server
            this.socket.emit(PlayerEvent.coordinates, {
                x: this.localPlayer.sprite.x,
                y: this.localPlayer.sprite.y,
                r: this.localPlayer.sprite.rotation,
                f: this.localPlayer.isFiring,
                m: this.localPlayer.isMoving,
                a: this.localPlayer.ammo,
            });

            // Check pickup collision
            if (this.pickup) {
                const distance = Phaser.Math.Distance.Between(this.localPlayer.sprite.x, this.localPlayer.sprite.y, this.pickup.sprite.x, this.pickup.sprite.y);

                if (distance < GameConfig.pickup.collisionRadius) {
                    // Player collected the pickup
                    this.localPlayer.giveAmmo(GameConfig.player.ammoPerPickup);

                    // Level up (cycle through 1-5)
                    const newLevel = (this.localPlayer.level % 5) + 1;
                    console.log(`[GameScene] Leveling up: ${this.localPlayer.level} -> ${newLevel}`);
                    this.localPlayer.setLevel(newLevel as Level);

                    // Sync level to ECS entity
                    const playerEntity = this.playerEntities.get(this.localPlayer.id);
                    if (playerEntity) {
                        const playerComponent = playerEntity.getComponent(PlayerComponent);
                        if (playerComponent) {
                            console.log(`[GameScene] Syncing ECS PlayerComponent level to ${newLevel}`);
                            playerComponent.setLevel(newLevel as Level);
                        }
                    }

                    this.socket.emit(PlayerEvent.pickup, {
                        uuid: this.localPlayer.id,
                        ammo: true,
                    });
                    this.pickup.destroy();
                    this.pickup = null;
                }
            }

            // Check asteroid collisions with local player
            this.asteroids.forEach(asteroid => {
                // Skip destroyed asteroids
                if (!asteroid.sprite.active) {
                    return;
                }

                const distance = Phaser.Math.Distance.Between(this.localPlayer!.sprite.x, this.localPlayer!.sprite.y, asteroid.sprite.x, asteroid.sprite.y);

                if (distance < GameConfig.asteroid.collisionRadius) {
                    // Player hit by asteroid - game over
                    this.socket.emit(PlayerEvent.hit, this.localPlayer!.id);
                    this.handlePlayerDeath(this.localPlayer!);
                }
            });

            // Check bullet collisions with asteroids
            if (this.localPlayer.bullets) {
                this.asteroids.forEach(asteroid => {
                    // Skip destroyed asteroids
                    if (!asteroid.sprite.active) {
                        return;
                    }

                    this.localPlayer!.bullets!.children.entries.forEach((bullet: any) => {
                        if (bullet.active) {
                            const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, asteroid.sprite.x, asteroid.sprite.y);

                            if (distance < GameConfig.asteroid.bulletCollisionRadius) {
                                // Bullet hit asteroid
                                bullet.setActive(false);
                                bullet.setVisible(false);
                                this.socket.emit(CometEvent.hit, asteroid.id);
                                asteroid.hit();
                            }
                        }
                    });
                });
            }
        }

        // Update all players
        this.players.forEach(player => player.update());

        // Update asteroids
        this.asteroids.forEach(asteroid => {
            // Skip destroyed asteroids
            if (!asteroid.sprite.active) {
                return;
            }
            asteroid.update();
        });
    }

    /**
     * Handles player death with game over screen and countdown.
     * 
     * Displays "YOU DIED!" message with a 3-second countdown before
     * reloading the page to restart the game.
     * 
     * @param _player - The player who died (unused but kept for future extensions)
     */
    private handlePlayerDeath(_player: Player): void {
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
     * Sets up keyboard input handling.
     * 
     * Input is actually handled by the InputSystem in the ECS architecture
     * and within the Player class for local players.
     */
    private setupInput(): void {
        // Input is handled in Player class
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
            console.log('Player joined:', playerData);
            const player = new Player(this, playerData, 'shooter-sprite-enemy', false);
            this.players.set(playerData.id, player);
        });

        // Local player (protagonist)
        this.socket.on(PlayerEvent.protagonist, (playerData: SpaceShip) => {
            console.log('Local player:', playerData);
            this.localPlayer = new Player(this, playerData, 'shooter-sprite', true);
            this.players.set(playerData.id, this.localPlayer);

            // Create ECS entity for local player
            const entity = createPlayerEntity(this.entityManager, this.localPlayer, true);
            this.playerEntities.set(playerData.id, entity);
        });

        // Existing players
        this.socket.on(PlayerEvent.players, (players: SpaceShip[]) => {
            console.log('Existing players:', players);
            players.forEach(playerData => {
                const player = new Player(this, playerData, 'shooter-sprite-enemy', false);
                if (playerData.ammo > 0) {
                    player.giveAmmo(playerData.ammo);
                }
                this.players.set(playerData.id, player);
            });
        });

        // Player quit
        this.socket.on(PlayerEvent.quit, (playerId: string) => {
            console.log('Player quit:', playerId);
            const player = this.players.get(playerId);
            if (player) {
                player.destroy();
                this.players.delete(playerId);
            }
        });

        // Player coordinates update
        this.socket.on(PlayerEvent.coordinates, (data: PlayerData) => {
            if (!data.player || !data.coors) return;

            const player = this.players.get(data.player.id);
            if (player && player !== this.localPlayer) {
                player.setPosition(data.coors.x, data.coors.y, data.coors.r);

                if (data.coors.m) {
                    player.showThrust();
                }

                if (data.coors.f) {
                    player.fire();
                }

                if (data.coors.a !== undefined) {
                    player.ammo = data.coors.a;
                }
            }
        });

        // Player hit
        this.socket.on(PlayerEvent.hit, (playerId: string) => {
            console.log('Player hit:', playerId);
            const player = this.players.get(playerId);
            if (player) {
                if (player === this.localPlayer) {
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
                    player.destroy();
                    this.players.delete(playerId);
                }
            }
        });

        // Pickup drop
        this.socket.on(GameEvent.drop, (coords: Coordinates) => {
            console.log('Pickup dropped:', coords);
            if (this.pickup) {
                this.pickup.destroy();
            }
            this.pickup = new Pickup(this, coords.x, coords.y);
        });

        // Player pickup
        this.socket.on(PlayerEvent.pickup, (data: PickupData) => {
            console.log('Player picked up:', data);
            const player = this.players.get(data.uuid);
            if (player) {
                player.giveAmmo(10);
            }
            if (this.pickup) {
                this.pickup.destroy();
                this.pickup = null;
            }
        });

        // Comet created
        this.socket.on(CometEvent.create, (cometData: Comet) => {
            console.log('Comet created:', cometData);
            const asteroid = new Asteroid(this, cometData.id);
            this.asteroids.set(cometData.id, asteroid);
        });

        // Comet coordinates
        this.socket.on(CometEvent.coordinates, (coords: Coordinates) => {
            this.asteroids.forEach(asteroid => {
                asteroid.setPosition(coords.x, coords.y);
            });
        });

        // Comet hit
        this.socket.on(CometEvent.hit, () => {
            console.log('Comet hit');
            this.asteroids.forEach(asteroid => {
                asteroid.hit();
            });
        });

        // Comet destroyed
        this.socket.on(CometEvent.destroy, () => {
            console.log('Comet destroyed');
            this.asteroids.forEach(asteroid => {
                asteroid.destroy();
            });
            this.asteroids.clear();
        });
    }

    /**
     * Emits player data to the Vue.js HUD via custom event.
     * 
     * Dispatches an 'updatePlayerData' event with the local player's current
     * name, level, ammo, and score. The Vue.js frontend listens for this
     * event to update the HUD display.
     */
    private emitPlayerDataToVue(): void {
        if (!this.localPlayer) return;

        window.dispatchEvent(
            new CustomEvent('updatePlayerData', {
                detail: {
                    name: this.localPlayer.name,
                    level: this.localPlayer.level,
                    ammo: this.localPlayer.ammo,
                    score: 0, // TODO: Add score tracking
                },
            })
        );
    }
}
