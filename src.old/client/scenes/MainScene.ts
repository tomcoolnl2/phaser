import Phaser from 'phaser';
import { Socket } from 'socket.io-client';
import { CometEvent, GameEvent, PlayerEvent } from '../../shared/events.model';
import { SpaceShip, Coordinates, Player as PlayerType, GameWindow } from '../../shared/models';
import { Player } from '../actors/player/player.class';
import { Asteroid } from '../props/asteroid/asteroid.class';
import { Projectile } from '../props/powers/projectile/projectile.class';

export class MainScene extends Phaser.Scene {
    private socket!: Socket;
    private actors: Player[] = [];
    private comets: Asteroid[] = [];
    private comet: Asteroid | null = null;
    private actor: Player | null = null;
    private projectile: Projectile | null = null;

    constructor() {
        super({ key: 'MainScene' });
    }

    preload(): void {
        // Load all game assets
        this.load.setBaseURL('.');
        this.load.crossOrigin = 'anonymous';
        
        this.load.image('space', 'assets/background.jpg');
        this.load.image('laser', 'assets/bullet.png');
        this.load.image('pickup', 'assets/pickup.png');
        
        this.load.spritesheet('dust', 'assets/dust.png', {
            frameWidth: 64,
            frameHeight: 64,
        });
        
        this.load.spritesheet('kaboom', 'assets/explosions.png', {
            frameWidth: 64,
            frameHeight: 64,
        });
        
        this.load.spritesheet('kaboom-big', 'assets/explosions-big.png', {
            frameWidth: 152,
            frameHeight: 152,
        });
        
        this.load.spritesheet('shooter-sprite', 'assets/ship.png', {
            frameWidth: 32,
            frameHeight: 32,
        });
        
        this.load.spritesheet('shooter-sprite-enemy', 'assets/ship-enemy.png', {
            frameWidth: 32,
            frameHeight: 32,
        });
        
        this.load.spritesheet('asteroid', 'assets/asteroids.png', {
            frameWidth: 128,
            frameHeight: 128,
        });
    }

    create(): void {
        // Get socket from window
        this.socket = (window as unknown as GameWindow).socket;
        
        // Setup game world
        this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'space').setOrigin(0, 0);
        
        // Setup physics
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
        
        // Setup socket event listeners
        this.setupSocketListeners();
    }

    update(): void {
        // Update game logic
        if (this.actor && this.actor.controls) {
            this.actor.view();
            
            // Emit player coordinates to server
            this.socket.emit(PlayerEvent.coordinates, {
                x: this.actor.player.x,
                y: this.actor.player.y,
                r: this.actor.player.rotation,
                f: this.actor.playerState.get('fire'),
                m: this.actor.playerState.get('moving'),
                a: this.actor.playerState.get('ammo'),
            });
        }
        
        // Handle collisions
        this.handleCollisions();
    }

    private setupSocketListeners(): void {
        this.socket.on(PlayerEvent.joined, (player: SpaceShip) => {
            this.actors.push(new Player(this, player, 'shooter-sprite-enemy'));
        });

        this.socket.on(PlayerEvent.protagonist, (player: SpaceShip) => {
            this.actor = new Player(this, player, 'shooter-sprite');
            this.actors.push(this.actor);
        });

        this.socket.on(PlayerEvent.players, (players: SpaceShip[]) => {
            players.forEach(player => {
                const enemy = new Player(this, player, 'shooter-sprite-enemy');
                if (player.ammo) {
                    enemy.assignPickup(this, enemy);
                }
                this.actors.push(enemy);
            });
        });

        this.socket.on(PlayerEvent.quit, (playerId: string) => {
            this.actors
                .filter(actor => actor.player.getData('id') === playerId)
                .forEach(actor => actor.player.destroy());
        });

        this.socket.on(GameEvent.drop, (coors: Coordinates) => {
            if (this.projectile) {
                this.projectile.pickup.item.destroy();
            }
            this.projectile = new Projectile(this);
            this.projectile.renderPickup(coors);
        });

        this.socket.on(CometEvent.create, (comet: Asteroid) => {
            this.comet = new Asteroid(this, comet);
            this.comets.push(this.comet);
        });

        this.socket.on(CometEvent.coordinates, (coors: Coordinates) => {
            if (this.comet) {
                this.comet.asteroid.setPosition(coors.x, coors.y);
            }
        });

        this.socket.on(CometEvent.destroy, () => {
            if (this.comet) {
                this.comet.asteroid.destroy();
                this.comet = null;
            }
        });

        this.socket.on(CometEvent.hit, () => {
            if (this.comet) {
                this.comet.hit();
            }
        });

        this.socket.on(PlayerEvent.hit, (enemyId: string) => {
            this.actors
                .filter(() => this.actor && this.actor.player.getData('id') === enemyId)
                .forEach(() => window.location.reload());
        });

        this.socket.on(PlayerEvent.pickup, (playerId: string) => {
            this.actors
                .filter(actor => actor.player.getData('id') === playerId)
                .forEach(actor => actor.assignPickup(this, actor));

            if (this.projectile) {
                this.projectile.pickup.item.destroy();
            }
        });

        this.socket.on(PlayerEvent.coordinates, (player: PlayerType) => {
            this.actors.forEach((actor: Player) => {
                if (actor.player.getData('id') === player.player?.id) {
                    actor.player.setPosition(player.coors!.x, player.coors!.y);
                    actor.player.setRotation(player.coors!.r);

                    if (actor.projectile && player.coors) {
                        actor.hud.update(player.coors.a);
                    }

                    if (player.coors?.f) {
                        actor.projectile?.fireWeapon();
                    }

                    if (player.coors?.m) {
                        actor.player.anims.play('accelerating', true);
                    }
                }
            });
        });
    }

    private handleCollisions(): void {
        if (!this.actor) return;

        // Comet collisions with players
        if (this.comet) {
            this.physics.add.overlap(
                this.comet.asteroid,
                this.actors.map(actor => actor.player),
                (comet, actor) => {
                    const actorSprite = actor as Phaser.Physics.Arcade.Sprite;
                    if (actorSprite.getData('id') !== this.actor!.player.getData('id')) {
                        actorSprite.destroy();
                        this.socket.emit(PlayerEvent.hit, actorSprite.getData('id'));
                    } else {
                        window.location.reload();
                    }
                }
            );

            // Projectile hits comet
            if (this.actor.projectile) {
                this.physics.add.overlap(
                    this.actor.projectile.weapon.bullets,
                    this.comets.map(comet => comet.asteroid),
                    (projectile, comet) => {
                        const cometSprite = comet as Phaser.Physics.Arcade.Sprite;
                        this.socket.emit(CometEvent.hit, cometSprite.getData('id'));
                        projectile.destroy();
                        this.comet?.hit();
                    }
                );
            }
        }

        // Player collisions
        if (this.actor.controls) {
            this.physics.add.collider(
                this.actor.player,
                this.actors.map(actor => actor.player)
            );

            // Projectile hits enemy
            if (this.actor.projectile) {
                this.physics.add.overlap(
                    this.actor.projectile.weapon.bullets,
                    this.actors.map(actor => actor.player),
                    (projectile, enemy) => {
                        const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
                        if (enemySprite.getData('id') !== this.actor!.player.getData('id')) {
                            this.socket.emit(PlayerEvent.hit, enemySprite.getData('id'));
                            projectile.destroy();
                            enemySprite.destroy();
                        }
                    }
                );
            }

            // Pickup collisions
            if (this.projectile) {
                this.physics.add.overlap(
                    this.projectile.pickup.item,
                    this.actors.map(actor => actor.player),
                    (pickup, actor) => {
                        const actorSprite = actor as Phaser.Physics.Arcade.Sprite;
                        const actorId = actorSprite.getData('id');
                        
                        this.actors
                            .filter(actorInstance => actorId === actorInstance.player.getData('id'))
                            .forEach(actorInstance => actorInstance.assignPickup(this, actorInstance));

                        this.socket.emit(PlayerEvent.pickup, {
                            uuid: actorId,
                            ammo: true,
                        });

                        pickup.destroy();
                    }
                );
            }
        }
    }
}
