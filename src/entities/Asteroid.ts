import Phaser from 'phaser';
import { GameConfig } from '../../shared/config';

export class Asteroid {

    public sprite: Phaser.Physics.Arcade.Sprite;
    public id: string;
    private scene: Phaser.Scene;
    private health: number = GameConfig.asteroid.health;
    private healthText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, id: string) {
        this.scene = scene;
        this.id = id;

        // Create asteroid sprite
        this.sprite = scene.physics.add.sprite(0, -128, 'asteroid').setOrigin(0.5, 0.5);

        // Setup physics
        this.sprite.setCollideWorldBounds(false);
        this.sprite.setImmovable(true);
        this.sprite.setMaxVelocity(GameConfig.asteroid.maxVelocity);

        // Store ID
        this.sprite.setData('id', this.id);

        // Play animation
        this.sprite.play('asteroid-spin');

        // Create health text (only if debug enabled)
        this.healthText = scene.add
            .text(this.sprite.x, this.sprite.y + 80, `HP: ${this.health}`, {
                fontSize: '16px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 4, y: 2 },
            })
            .setOrigin(0.5)
            .setVisible(GameConfig.debug.showAsteroidHealth);
    }

    public update(): void {
        // Update health text position to follow asteroid
        this.healthText.setPosition(this.sprite.x, this.sprite.y + 80);
    }

    public setPosition(x: number, y: number): void {
        this.sprite.setPosition(x, y);
        this.healthText.setPosition(x, y + 80);
    }

    public hit(): void {
        // Safety check - don't process hit if already destroyed
        if (!this.sprite.active || this.health <= 0) {
            return;
        }

        this.health--;

        // Update health text
        this.healthText.setText(`HP: ${this.health}`);

        // Change color based on health
        if (this.health === 2) {
            this.healthText.setColor('#ffff00'); // Yellow
        } else if (this.health === 1) {
            this.healthText.setColor('#ff0000'); // Red
        }

        // Flash effect
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 1,
        });

        if (this.health <= 0) {
            this.destroy();
        }
    }

    public destroy(): void {
        // Prevent double-destroy
        if (!this.sprite.active) {
            return;
        }

        // Play big explosion
        const explosion = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'kaboom-big');
        explosion.play('explode-big');
        explosion.once('animationcomplete', () => explosion.destroy());

        this.sprite.destroy();
        this.healthText.destroy();
    }
}
