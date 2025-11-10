import Phaser from 'phaser';
import { GameConfig } from '../../shared/config';

/**
 * Asteroid entity with health system and visual feedback.
 *
 * Represents a destructible asteroid that spins continuously and displays
 * health information. Asteroids start with configurable HP (default 3) and
 * provide visual feedback through color changes (green → yellow → red) as
 * they take damage. Health text is shown when debug mode is enabled.
 *
 * Features:
 * - Continuous spin animation
 * - Health tracking with visual feedback
 * - Flash effect on damage
 * - Large explosion on destruction
 * - Debug health display
 *
 * @example
 * ```typescript
 * const asteroid = new Asteroid(scene, 'asteroid-1');
 * asteroid.setPosition(100, 100);
 * asteroid.hit(); // Damages asteroid, changes color
 * ```
 */
export class Asteroid {
    /** The Phaser sprite representing the asteroid */
    public sprite: Phaser.Physics.Arcade.Sprite;
    /** Unique identifier for the asteroid */
    public id: string;
    /** The scene where the asteroid exists */
    private scene: Phaser.Scene;
    /** Current health points (configurable via GameConfig) */
    private health: number = GameConfig.asteroid.health;
    /** Text display showing current health (visible in debug mode) */
    private healthText: Phaser.GameObjects.Text;

    /**
     * Creates a new Asteroid instance.
     * @param scene - The scene where the asteroid will be added
     * @param id - Unique identifier for this asteroid
     */
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

    /**
     * Updates the asteroid's health text position to follow the sprite.
     * Called every frame to keep the health display synchronized.
     */
    public update(): void {
        // Update health text position to follow asteroid
        this.healthText.setPosition(this.sprite.x, this.sprite.y + 80);
    }

    /**
     * Sets the asteroid's position and updates health text accordingly.
     * @param x - X coordinate
     * @param y - Y coordinate
     */
    public setPosition(x: number, y: number): void {
        this.sprite.setPosition(x, y);
        this.healthText.setPosition(x, y + 80);
    }

    /**
     * Damages the asteroid and updates visual feedback.
     *
     * Decreases health by 1 and changes the health text color based on
     * remaining health:
     * - 3 HP: Green (#00ff00)
     * - 2 HP: Yellow (#ffff00)
     * - 1 HP: Red (#ff0000)
     *
     * Plays a flash effect on hit and destroys the asteroid when health
     * reaches 0. Includes safety check to prevent processing hits on
     * already destroyed asteroids.
     */
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

    /**
     * Destroys the asteroid with a large explosion animation.
     *
     * Plays the 'explode-big' animation at the asteroid's final position
     * before removing the sprite from the scene.
     */
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
