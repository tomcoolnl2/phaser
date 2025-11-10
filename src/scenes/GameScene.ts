import Phaser from 'phaser';
import { Socket } from 'socket.io-client';
import { PlayerEvent, GameEvent, CometEvent } from '../../shared/events';
import { SpaceShip, Coordinates, Player as PlayerData, Comet, PickupData } from '../../shared/models';
import { GameConfig } from '../../shared/config';
import { Player } from '../entities/Player';
import { Asteroid } from '../entities/Asteroid';
import { Pickup } from '../entities/Pickup';

export class GameScene extends Phaser.Scene {
    private socket!: Socket;
    private players: Map<string, Player> = new Map();
    private localPlayer: Player | null = null;
    private asteroids: Map<string, Asteroid> = new Map();
    private pickup: Pickup | null = null;

    constructor() {
        super({ key: 'GameScene' });
    }

    create(): void {
        // Get socket from registry
        this.socket = this.registry.get('socket') as Socket;

        // Setup world
        this.createWorld();

        // Setup socket listeners
        this.setupSocketListeners();

        // Setup input
        this.setupInput();

        // Authenticate player (join the game)
        const playerName = prompt('Enter your name:') || `Player ${Math.floor(Math.random() * 1000)}`;
        this.socket.emit(PlayerEvent.authenticate, {
            name: playerName,
        }, {
            x: this.scale.width,
            y: this.scale.height,
        });
    }

    update(): void {
        // Update local player
        if (this.localPlayer) {
            this.localPlayer.update();

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
                const distance = Phaser.Math.Distance.Between(
                    this.localPlayer.sprite.x,
                    this.localPlayer.sprite.y,
                    this.pickup.sprite.x,
                    this.pickup.sprite.y
                );

                if (distance < GameConfig.pickup.collisionRadius) {
                    // Player collected the pickup
                    this.localPlayer.giveAmmo(GameConfig.player.ammoPerPickup);
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
                const distance = Phaser.Math.Distance.Between(
                    this.localPlayer!.sprite.x,
                    this.localPlayer!.sprite.y,
                    asteroid.sprite.x,
                    asteroid.sprite.y
                );

                if (distance < GameConfig.asteroid.collisionRadius) {
                    // Player hit by asteroid - game over
                    this.socket.emit(PlayerEvent.hit, this.localPlayer!.id);
                    this.handlePlayerDeath(this.localPlayer!);
                }
            });

            // Check bullet collisions with asteroids
            if (this.localPlayer.bullets) {
                this.asteroids.forEach(asteroid => {
                    this.localPlayer!.bullets!.children.entries.forEach((bullet: any) => {
                        if (bullet.active) {
                            const distance = Phaser.Math.Distance.Between(
                                bullet.x,
                                bullet.y,
                                asteroid.sprite.x,
                                asteroid.sprite.y
                            );

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
        this.asteroids.forEach(asteroid => asteroid.update());
    }

    private handlePlayerDeath(player: Player): void {
        this.scene.pause();
        const gameOverText = this.add
            .text(this.scale.width / 2, this.scale.height / 2, 'YOU DIED!', {
                fontSize: '64px',
                color: '#ff0000',
            })
            .setOrigin(0.5);

        this.add
            .text(this.scale.width / 2, this.scale.height / 2 + 60, 'Reloading in 3 seconds...', {
                fontSize: '24px',
                color: '#ffffff',
            })
            .setOrigin(0.5);

        setTimeout(() => window.location.reload(), 3000);
    }

    private createWorld(): void {
        // Add background
        this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'space').setOrigin(0, 0);

        // Setup world bounds
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    }

    private setupInput(): void {
        // Input is handled in Player class
    }

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
}
