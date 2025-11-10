import Phaser from 'phaser';
import { SpaceShip, Level } from '../../shared/models';
import { GameConfig } from '../../shared/config';

/**
 * Player - Represents a player spaceship in the game.
 *
 * This class manages a player entity including its sprite, physics, controls,
 * weapons, and visual indicators (name, level, ammo). It handles both local
 * players (controlled by keyboard) and remote players (controlled by network).
 *
 * Features:
 * - Race car/space ship physics with momentum
 * - Smooth rotation and directional thrust
 * - Weapon system with level-based bullets
 * - Visual feedback (name tag, level display, ammo counter)
 * - Local player input handling
 *
 * This is a legacy OOP class being gradually migrated to ECS. See the ECS
 * factory in `src/ecs/factories.ts` for the bridge to the new architecture.
 *
 * @example
 * ```typescript
 * const player = new Player(
 *     scene,
 *     { id: 'p1', name: 'Alice', x: 100, y: 100, level: 1 },
 *     'shooter-sprite',
 *     true // isLocal
 * );
 *
 * // In scene update loop
 * player.update();
 * ```
 */
export class Player {
    /** The Phaser sprite representing this player */
    public sprite: Phaser.Physics.Arcade.Sprite;

    /** Unique player identifier */
    public id: string;

    /** Player display name */
    public name: string;

    /** Current player level (1-5) */
    public level: Level = 1;

    /** Current ammunition count */
    public ammo: number = 0;

    /** Whether player is currently firing */
    public isFiring: boolean = false;

    /** Whether player is currently moving */
    public isMoving: boolean = false;

    /** Bullet pool for this player (local players only) */
    public bullets?: Phaser.Physics.Arcade.Group;

    private scene: Phaser.Scene;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private fireKey?: Phaser.Input.Keyboard.Key;
    private nameText: Phaser.GameObjects.Text;
    private levelText: Phaser.GameObjects.Text;
    private ammoText?: Phaser.GameObjects.Text;
    private isLocal: boolean;
    // TODO: Implement thrust particle effects
    private thrustParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

    private readonly MAX_VELOCITY = GameConfig.player.maxVelocity;
    private readonly FIRE_RATE = GameConfig.player.fireRate;
    private readonly ROTATION_SPEED = 0.04; // Smooth rotation factor (lower = slower turning)
    private lastFired: number = 0;
    private targetRotation: number = 0;

    /**
     * Creates a new Player instance.
     * @param scene - The Phaser scene
     * @param playerData - Initial player data (position, name, level, etc.)
     * @param spriteKey - Texture key for the player sprite
     * @param isLocal - True if this is the local player (controlled by keyboard)
     */
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

    /**
     * Sets up keyboard controls for the local player.
     * Creates cursor keys (arrows) and space bar for firing.
     * @private
     */
    private setupControls(): void {
        if (!this.scene.input.keyboard) {
            return;
        }

        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.fireKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    /**
     * Creates a bullet pool for this player's weapon.
     * Bullets are reused from the pool for performance.
     * @private
     */
    private createBullets(): void {
        this.bullets = this.scene.physics.add.group({
            maxSize: 10,
        });
    }

    /**
     * Creates the ammo counter UI element (local players only).
     * Displays in top-left corner of screen.
     * @private
     */
    private createAmmoDisplay(): void {
        this.ammoText = this.scene.add
            .text(16, 16, `Ammo: ${this.ammo}`, {
                fontSize: '18px',
                color: '#ffffff',
            })
            .setScrollFactor(0);
    }

    /**
     * Updates the player's state every frame.
     *
     * For all players:
     * - Updates name and level text positions to follow sprite
     *
     * For local players:
     * - Processes keyboard input (rotation, thrust, brake, fire)
     * - Applies physics (momentum, drift, race car feel)
     * - Updates ammo display
     */
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

    /**
     * Fires a bullet from the player's weapon.
     *
     * Checks fire rate cooldown and ammo availability before spawning a bullet.
     * The bullet is pulled from a pool, positioned at the player's location,
     * and given velocity in the direction the player is facing. Bullet sprite
     * matches the player's current level.
     *
     * Fire rate is limited by FIRE_RATE constant and ammo is consumed per shot.
     */
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

    /**
     * Shows thrust visual effects (placeholder for future particle effects).
     */
    public showThrust(): void {
        // Could add particle effects here
    }

    /**
     * Adds ammunition to the player's weapon.
     * @param amount - Amount of ammo to add
     */
    public giveAmmo(amount: number): void {
        this.ammo = amount;
        if (this.ammoText) {
            this.ammoText.setText(`Ammo: ${this.ammo}`);
        }
    }

    /**
     * Updates the player's level and level display.
     * @param level - New level (1-5)
     */
    public setLevel(level: Level): void {
        this.level = level;
        this.levelText.setText(`Level: ${this.level}`);
    }

    /**
     * Teleports the player to a new position with rotation.
     * @param x - X coordinate
     * @param y - Y coordinate
     * @param rotation - Rotation in radians
     */
    public setPosition(x: number, y: number, rotation: number): void {
        this.sprite.setPosition(x, y);
        this.sprite.setRotation(rotation);
        this.targetRotation = rotation; // Keep target rotation in sync
    }

    /**
     * Destroys the player and all associated game objects.
     * Plays an explosion animation at the player's final position.
     */
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
