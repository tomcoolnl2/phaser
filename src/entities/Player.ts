import Phaser from 'phaser';
import { SpaceShip } from '../../shared/models';

export class Player {
    public sprite: Phaser.Physics.Arcade.Sprite;
    public id: string;
    public name: string;
    public ammo: number = 0;
    public isFiring: boolean = false;
    public isMoving: boolean = false;

    private scene: Phaser.Scene;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private fireKey?: Phaser.Input.Keyboard.Key;
    private bullets?: Phaser.Physics.Arcade.Group;
    private nameText: Phaser.GameObjects.Text;
    private ammoText?: Phaser.GameObjects.Text;
    private isLocal: boolean;
    private thrustParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

    private readonly ANGULAR_VELOCITY = 300;
    private readonly ACCELERATION = 100;
    private readonly MAX_VELOCITY = 200;
    private readonly FIRE_RATE = 1000;
    private lastFired: number = 0;

    constructor(scene: Phaser.Scene, playerData: SpaceShip, spriteKey: string, isLocal: boolean) {
        this.scene = scene;
        this.id = playerData.id;
        this.name = playerData.name;
        this.ammo = playerData.ammo || 0;
        this.isLocal = isLocal;

        // Create sprite
        this.sprite = scene.physics.add
            .sprite(playerData.x, playerData.y, spriteKey)
            .setOrigin(0.5, 0.5);

        // Setup physics
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setBounce(0.1);
        this.sprite.setDrag(80);
        this.sprite.setMaxVelocity(this.MAX_VELOCITY);

        // Store ID in sprite data
        this.sprite.setData('id', this.id);

        // Create player name label
        this.nameText = scene.add
            .text(this.sprite.x, this.sprite.y - 30, this.name, {
                fontSize: '12px',
                color: '#ffffff',
            })
            .setOrigin(0.5);

        // Setup controls for local player
        if (this.isLocal) {
            this.setupControls();
            this.createBullets();
            this.createAmmoDisplay();
        }
    }

    private setupControls(): void {
        if (!this.scene.input.keyboard) return;

        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.fireKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    private createBullets(): void {
        this.bullets = this.scene.physics.add.group({
            defaultKey: 'laser',
            maxSize: 10,
        });
    }

    private createAmmoDisplay(): void {
        this.ammoText = this.scene.add
            .text(16, 16, `Ammo: ${this.ammo}`, {
                fontSize: '18px',
                color: '#ffffff',
            })
            .setScrollFactor(0);
    }

    public update(): void {
        // Update name position
        this.nameText.setPosition(this.sprite.x, this.sprite.y - 30);

        // Only process input for local player
        if (!this.isLocal) return;

        this.isMoving = false;
        this.isFiring = false;

        if (!this.cursors || !this.sprite.active) return;

        // Rotation
        if (this.cursors.left?.isDown) {
            this.sprite.setAngularVelocity(-this.ANGULAR_VELOCITY);
        } else if (this.cursors.right?.isDown) {
            this.sprite.setAngularVelocity(this.ANGULAR_VELOCITY);
        } else {
            this.sprite.setAngularVelocity(0);
        }

        // Thrust
        if (this.cursors.up?.isDown) {
            const acceleration = this.sprite.body as Phaser.Physics.Arcade.Body;
            this.scene.physics.velocityFromRotation(
                this.sprite.rotation,
                this.ACCELERATION,
                acceleration.acceleration as Phaser.Math.Vector2
            );
            this.isMoving = true;
            this.sprite.anims.play('accelerating', true);
            this.showThrust();
        } else {
            this.sprite.setAcceleration(0);
        }

        // Fire
        if (this.fireKey?.isDown && this.ammo > 0) {
            this.fire();
        }

        // Update ammo display
        if (this.ammoText) {
            this.ammoText.setText(`Ammo: ${this.ammo}`);
        }
    }

    public fire(): void {
        const now = Date.now();
        if (now - this.lastFired < this.FIRE_RATE || !this.bullets || this.ammo <= 0) {
            return;
        }

        this.lastFired = now;
        this.isFiring = true;

        if (this.isLocal) {
            this.ammo--;
        }

        // Get bullet from pool
        const bullet = this.bullets.get(this.sprite.x, this.sprite.y, 'laser') as Phaser.Physics.Arcade.Sprite;
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);

            // Set bullet velocity based on ship rotation
            this.scene.physics.velocityFromRotation(this.sprite.rotation, 400, bullet.body!.velocity);

            // Kill bullet after traveling off screen
            this.scene.time.delayedCall(2000, () => {
                if (bullet.active) {
                    bullet.setActive(false);
                    bullet.setVisible(false);
                }
            });
        }
    }

    public showThrust(): void {
        // Could add particle effects here
    }

    public giveAmmo(amount: number): void {
        this.ammo = amount;
        if (this.ammoText) {
            this.ammoText.setText(`Ammo: ${this.ammo}`);
        }
    }

    public setPosition(x: number, y: number, rotation: number): void {
        this.sprite.setPosition(x, y);
        this.sprite.setRotation(rotation);
    }

    public destroy(): void {
        // Play explosion animation
        const explosion = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'kaboom');
        explosion.play('explode');
        explosion.once('animationcomplete', () => explosion.destroy());

        this.sprite.destroy();
        this.nameText.destroy();
        if (this.ammoText) {
            this.ammoText.destroy();
        }
        if (this.bullets) {
            this.bullets.clear(true, true);
        }
    }
}
