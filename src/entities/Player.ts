import Phaser from 'phaser';
import { SpaceShip, Level } from '../../shared/models';
import { GameConfig } from '../../shared/config';

export class Player {
    public sprite: Phaser.Physics.Arcade.Sprite;
    public id: string;
    public name: string;
    public level: Level = 1;
    public ammo: number = 0;
    public isFiring: boolean = false;
    public isMoving: boolean = false;
    public bullets?: Phaser.Physics.Arcade.Group;

    private scene: Phaser.Scene;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private fireKey?: Phaser.Input.Keyboard.Key;
    private nameText: Phaser.GameObjects.Text;
    private levelText: Phaser.GameObjects.Text;
    private ammoText?: Phaser.GameObjects.Text;
    private isLocal: boolean;
    private thrustParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

    private readonly ANGULAR_VELOCITY = GameConfig.player.angularVelocity;
    private readonly ACCELERATION = GameConfig.player.acceleration;
    private readonly MAX_VELOCITY = GameConfig.player.maxVelocity;
    private readonly FIRE_RATE = GameConfig.player.fireRate;
    private readonly ROTATION_SPEED = 0.03; // Smooth rotation factor (lower = slower turning)
    private lastFired: number = 0;
    private targetRotation: number = 0;

    constructor(scene: Phaser.Scene, playerData: SpaceShip, spriteKey: string, isLocal: boolean) {
        this.scene = scene;
        this.id = playerData.id;
        this.name = playerData.name;
        this.level = playerData.level || 1;
        this.ammo = playerData.ammo || GameConfig.player.startingAmmo;
        this.isLocal = isLocal;

        this.sprite = scene.physics.add.sprite(playerData.x, playerData.y, spriteKey).setOrigin(0.5, 0.5);

        // Setup physics
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setBounce(0);
        this.sprite.setDamping(true);
        this.sprite.setDrag(0.99);
        this.sprite.setMaxVelocity(this.MAX_VELOCITY);
        this.sprite.setAngularDrag(GameConfig.player.angularDrag);

        // Store ID in sprite data
        this.sprite.setData('id', this.id);

        // Create player name label
        this.nameText = scene.add
            .text(this.sprite.x, this.sprite.y - 30, this.name, {
                fontSize: '12px',
                color: '#ffffff',
            })
            .setOrigin(0.5);

        // Create level label
        this.levelText = scene.add
            .text(this.sprite.x, this.sprite.y - 18, `Level: ${this.level}`, {
                fontSize: '10px',
                color: '#ffff00',
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
        // Update name and level position
        this.nameText.setPosition(this.sprite.x, this.sprite.y - 30);
        this.levelText.setPosition(this.sprite.x, this.sprite.y - 18);

        // Only process input for local player
        if (!this.isLocal) return;

        this.isMoving = false;
        this.isFiring = false;

        if (!this.cursors || !this.sprite.active) return;

        // Smooth rotation based on arrow keys
        if (this.cursors.left?.isDown) {
            this.targetRotation -= this.ROTATION_SPEED;
        }
        if (this.cursors.right?.isDown) {
            this.targetRotation += this.ROTATION_SPEED;
        }

        // Apply rotation smoothly
        this.sprite.rotation = this.targetRotation;

        // Direct movement - race car style (moves in direction facing)
        if (this.cursors.up?.isDown) {
            // Set velocity directly in the direction the ship is facing
            this.scene.physics.velocityFromRotation(this.sprite.rotation, this.MAX_VELOCITY, this.sprite.body!.velocity);
            this.isMoving = true;
            this.sprite.anims.play('accelerating', true);
            this.showThrust();
        } else if (this.cursors.down?.isDown) {
            // Reverse/brake - stops quickly
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            body.velocity.x *= 0.85; // Fast braking when reverse is pressed
            body.velocity.y *= 0.85;
        } else {
            // Slow down gradually (drift feel) instead of instant stop
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            body.velocity.x *= 0.97; // 3% friction per frame (higher = slower stopping)
            body.velocity.y *= 0.97;
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

        // Get bullet from pool using level-based sprite
        const bulletKey = `laser-level-${this.level}`;
        const bullet = this.bullets.get(this.sprite.x, this.sprite.y, bulletKey) as Phaser.Physics.Arcade.Sprite;
        if (bullet) {
            // Explicitly set the texture to ensure it's correct (Phaser pool reuse can cause issues)
            bullet.setTexture(bulletKey);
            bullet.setActive(true);
            bullet.setVisible(true);

            // Rotate bullet to match ship direction (add 90° offset since bullet sprite points up)
            bullet.setRotation(this.sprite.rotation + Math.PI / 2);

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

    public setLevel(level: Level): void {
        this.level = level;
        this.levelText.setText(`Level: ${this.level}`);
    }

    public setPosition(x: number, y: number, rotation: number): void {
        this.sprite.setPosition(x, y);
        this.sprite.setRotation(rotation);
        this.targetRotation = rotation; // Keep target rotation in sync
    }

    public destroy(): void {
        // Play explosion animation
        const explosion = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'kaboom');
        explosion.play('explode');
        explosion.once('animationcomplete', () => explosion.destroy());

        this.sprite.destroy();
        this.nameText.destroy();
        this.levelText.destroy();
        if (this.ammoText) {
            this.ammoText.destroy();
        }
        if (this.bullets) {
            this.bullets.clear(true, true);
        }
    }
}
