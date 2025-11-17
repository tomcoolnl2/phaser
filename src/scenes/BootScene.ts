import Phaser from 'phaser';

/**
 * Boot scene responsible for loading all game assets and creating animations.
 *
 * This scene loads all sprites, spritesheets, and images needed for the game,
 * displays a loading progress bar, and creates all global animations before
 * transitioning to the main GameScene.
 *
 * Assets loaded:
 * - Background image
 * - Player and enemy ship spritesheets
 * - 5 levels of bullet sprites
 * - Pickup items
 * - Particle effects (dust)
 * - Explosion animations (regular and large)
 * - Asteroid spritesheets
 *
 * Animations created:
 * - 'accelerating': Ship thrust animation
 * - 'explode': Standard explosion
 * - 'explode-big': Large explosion for asteroids
 * - 'dust': Particle effect
 * - 'asteroid-spin': Asteroid rotation
 */
export class BootScene extends Phaser.Scene {
    /**
     * Creates the BootScene with key 'BootScene'.
     */
    constructor() {
        super({ key: 'BootScene' });
    }

    /**
     * Loads all game assets with a visual progress bar.
     *
     * Preloads images, spritesheets, and displays loading progress to the user.
     * All bullet levels (1-5) are loaded for the weapon upgrade system.
     */
    public preload(): void {
        this.load.setBaseURL('.');

        this.load.image('space', 'assets/background.jpg');

        this.load.spritesheet('shooter-sprite', 'assets/ship.png', {
            frameWidth: 50,
            frameHeight: 64,
        });

        this.load.spritesheet('shooter-sprite-enemy', 'assets/ship-enemy.png', {
            frameWidth: 32,
            frameHeight: 32,
        });

        for (let i = 1; i <= 5; i++) {
            this.load.image(`laser-level-${i}`, `assets/bullet/bullet${i}.png`);
        }

        this.load.image('pickup-ammo', 'assets/pickup/pickup-ammo.png');

        this.load.image('pickup-health', 'assets/pickup/pickup-health.png');

        this.load.spritesheet('pickup-coin', 'assets/pickup/pickup-coin.png', {
            frameWidth: 32,
            frameHeight: 32,
        });

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

    /**
     * Creates all global animations and transitions to GameScene.
     *
     * Called automatically after all assets finish loading. Animations
     * created here are available to all scenes.
     */
    public create(): void {
        // Create animations that will be available globally
        this.createAnimations();

        // Start the game scene
        this.scene.start('GameScene');
    }

    /**
     * Creates a visual loading bar with progress percentage.
     *
     * Displays a progress bar and percentage text that updates as assets load.
     * The loading UI is automatically destroyed when loading completes.
     */
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

    /**
     * Creates all global animations used throughout the game.
     *
     * Animations created:
     * - 'accelerating': 2-frame ship thrust animation
     * - 'explode': 16-frame standard explosion
     * - 'explode-big': 16-frame large explosion for asteroids
     * - 'dust': 16-frame looping particle effect
     * - 'asteroid-spin': 31-frame looping asteroid rotation
     */
    private createAnimations(): void {
        // Coin/Star pickup animation
        this.anims.create({
            key: 'pickup-coin-spin',
            frames: this.anims.generateFrameNumbers('pickup-coin', { start: 0, end: 15 }),
            frameRate: 16,
            repeat: -1,
        });
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
