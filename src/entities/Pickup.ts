import Phaser from 'phaser';

export class Pickup {
    public sprite: Phaser.Physics.Arcade.Sprite;
    private scene: Phaser.Scene;
    private particles: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        this.scene = scene;

        // Create pickup sprite
        this.sprite = scene.physics.add.sprite(x, y, 'pickup').setOrigin(0.5, 0.5);

        // Add floating animation
        scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Add rotation
        scene.tweens.add({
            targets: this.sprite,
            angle: 360,
            duration: 2000,
            repeat: -1,
        });

        // Add particle effect
        this.particles = scene.add.particles(x, y, 'dust', {
            speed: 20,
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 1000,
            frequency: 100,
        });
    }

    public destroy(): void {
        this.particles.destroy();
        this.sprite.destroy();
    }
}
