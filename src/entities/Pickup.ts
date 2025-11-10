import Phaser from 'phaser';

/**
 * Collectible pickup item with visual effects.
 * 
 * Creates an animated pickup item that floats and rotates continuously.
 * The pickup emits particle effects to make it more visually appealing
 * and easier to spot during gameplay.
 * 
 * Features:
 * - Floating animation (up/down motion)
 * - Continuous rotation
 * - Particle effects
 * 
 * @example
 * ```typescript
 * const pickup = new Pickup(scene, 400, 300);
 * // Later, when collected:
 * pickup.destroy();
 * ```
 */
export class Pickup {
    /** The Phaser sprite representing the pickup */
    public sprite: Phaser.Physics.Arcade.Sprite;
    /** The scene where the pickup exists */
    private scene: Phaser.Scene;
    /** Particle emitter for visual effects */
    private particles: Phaser.GameObjects.Particles.ParticleEmitter;

    /**
     * Creates a new Pickup instance with animations and particle effects.
     * @param scene - The scene where the pickup will be added
     * @param x - X coordinate of the pickup
     * @param y - Y coordinate of the pickup
     */
    constructor(scene: Phaser.Scene, x: number, y: number) {
        this.scene = scene;

        // Create pickup sprite
        this.sprite = this.scene.physics.add.sprite(x, y, 'pickup').setOrigin(0.5, 0.5);

        // Add floating animation
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Add rotation
        this.scene.tweens.add({
            targets: this.sprite,
            angle: 360,
            duration: 2000,
            repeat: -1,
        });

        // Add particle effect
        this.particles = this.scene.add.particles(x, y, 'dust', {
            speed: 20,
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 1000,
            frequency: 100,
        });
    }

    /**
     * Destroys the pickup and all associated effects.
     * Removes both the sprite and particle emitter from the scene.
     */
    public destroy(): void {
        this.particles.destroy();
        this.sprite.destroy();
    }
}
