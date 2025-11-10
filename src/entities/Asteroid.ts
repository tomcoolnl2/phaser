import Phaser from 'phaser';

export class Asteroid {
    public sprite: Phaser.Physics.Arcade.Sprite;
    public id: string;
    private scene: Phaser.Scene;
    private health: number = 3;

    constructor(scene: Phaser.Scene, id: string) {
        this.scene = scene;
        this.id = id;

        // Create asteroid sprite
        this.sprite = scene.physics.add
            .sprite(0, -128, 'asteroid')
            .setOrigin(0.5, 0.5);

        // Setup physics
        this.sprite.setCollideWorldBounds(false);
        this.sprite.setImmovable(true);
        this.sprite.setMaxVelocity(100);

        // Store ID
        this.sprite.setData('id', this.id);

        // Play animation
        this.sprite.play('asteroid-spin');
    }

    public update(): void {
        // Asteroids are controlled by server
    }

    public setPosition(x: number, y: number): void {
        this.sprite.setPosition(x, y);
    }

    public hit(): void {
        this.health--;

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
        // Play big explosion
        const explosion = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'kaboom-big');
        explosion.play('explode-big');
        explosion.once('animationcomplete', () => explosion.destroy());

        this.sprite.destroy();
    }
}
