import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    //
    constructor() {
        super({ key: 'BootScene' });
    }

    public preload(): void {
        this.load.setBaseURL('.');

        this.load.image('space', 'assets/background.jpg');

        this.load.spritesheet('shooter-sprite', 'assets/ship.png', {
            frameWidth: 32,
            frameHeight: 32,
        });

        this.load.spritesheet('shooter-sprite-enemy', 'assets/ship-enemy.png', {
            frameWidth: 32,
            frameHeight: 32,
        });

        for (let i = 1; i <= 5; i++) {
            this.load.image(`laser-level-${i}`, `assets/bullet/bullet${i}.png`);
        }

        this.load.image('pickup', 'assets/pickup/pickup-ammo.png');

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

        this.load.spritesheet('asteroid', 'assets/asteroids.png', {
            frameWidth: 128,
            frameHeight: 128,
        });

        this.createLoadingBar();
    }

    public create(): void {
        // Create animations that will be available globally
        this.createAnimations();

        // Start the game scene
        this.scene.start('GameScene');
    }

    private createLoadingBar(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            fontSize: '20px',
            color: '#ffffff',
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.add.text(width / 2, height / 2, '0%', {
            fontSize: '18px',
            color: '#ffffff',
        });
        percentText.setOrigin(0.5, 0.5);

        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
            percentText.setText(`${Math.floor(value * 100)}%`);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });
    }

    private createAnimations(): void {
        // Ship acceleration animation
        this.anims.create({
            key: 'accelerating',
            frames: this.anims.generateFrameNumbers('shooter-sprite', { start: 0, end: 1 }),
            frameRate: 10,
            repeat: 0,
        });

        // Explosion animations
        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('kaboom', { start: 0, end: 15 }),
            frameRate: 30,
            hideOnComplete: true,
        });

        this.anims.create({
            key: 'explode-big',
            frames: this.anims.generateFrameNumbers('kaboom-big', { start: 0, end: 15 }),
            frameRate: 30,
            hideOnComplete: true,
        });

        // Particle dust animation
        this.anims.create({
            key: 'dust',
            frames: this.anims.generateFrameNumbers('dust', { start: 0, end: 15 }),
            frameRate: 20,
            repeat: -1,
        });

        // Asteroid animation
        this.anims.create({
            key: 'asteroid-spin',
            frames: this.anims.generateFrameNumbers('asteroid', { start: 0, end: 30 }),
            frameRate: 10,
            repeat: -1,
        });
    }
}
