import { System } from '@/ecs/core/System';
import { Entity } from '@/ecs/core/Entity';
import { ComponentClass } from '@/ecs/core/Component';
import { GameConfig } from '@shared/config';
import { GameScene } from '@/scenes/GameScene';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { AsteroidComponent } from '@/ecs/components/AsteroidComponent';
import { HealthComponent } from '@/ecs/components/HealthComponent';

/**
 * System that manages asteroid behavior and visual feedback.
 *
 * Handles:
 * - Health text display (debug mode)
 * - Health text color changes based on damage
 * - Flash effect on damage
 * - Destruction with explosion animation
 *
 * Requires entities to have: TransformComponent, AsteroidComponent, HealthComponent
 *
 * @example
 * ```typescript
 * const asteroidSystem = new AsteroidSystem(scene);
 * entityManager.addSystem(asteroidSystem);
 * ```
 */
export class AsteroidSystem extends System {

    /** Map of asteroid IDs to their health text displays */
    private healthTexts: Map<string, Phaser.GameObjects.Text> = new Map();

    constructor(protected scene: GameScene) {
        super(scene);
    }

    /**
     * Returns the components required by this system.
     */
    public getRequiredComponents(): ComponentClass[] {
        return [TransformComponent, AsteroidComponent, HealthComponent];
    }

    /**
     * Public method to destroy an asteroid by its ID, with explosion and cleanup.
     * Used by GameScene when receiving AsteroidEvent.destroy from the server.
     *
     * @param asteroidId - Unique identifier for the asteroid
     */
    public destroyAsteroidById(asteroidId: string): void {
        // Find the entity with this asteroidId
        const entities = this.scene.entityManager.queryEntities(AsteroidComponent, TransformComponent);
        const entity = entities.find((e: Entity) => {
            const asteroid = e.getComponent(AsteroidComponent);
            return asteroid && asteroid.asteroidId === asteroidId;
        });
        if (!entity) {
            return;
        }
        const transform = entity.getComponent(TransformComponent);
        if (!transform) {
            return;
        }
        this.destroyAsteroid(entity, transform, asteroidId);
    }

    /**
     * Updates a single asteroid entity.
     *
     * - Updates health text position to follow asteroid
     * - Updates health text content and color based on health
     * - Triggers destruction when health reaches 0
     *
     * @param entity - The asteroid entity to update
     * @param _deltaTime - Time elapsed since last frame (unused)
     */
    public update(entity: Entity, _deltaTime: number): void {
        const transform = entity.getComponent(TransformComponent)!;
        const asteroid = entity.getComponent(AsteroidComponent)!;
        const health = entity.getComponent(HealthComponent)!;

        // Check if sprite is destroyed
        if (!transform.sprite.active) {
            this.cleanupHealthText(asteroid.asteroidId);
            return;
        }

        // Create health text if it doesn't exist yet
        if (!this.healthTexts.has(asteroid.asteroidId)) {
            this.createHealthText(asteroid.asteroidId, transform, health);
        }

        // Update health text
        const healthText = this.healthTexts.get(asteroid.asteroidId);
        if (healthText) {
            healthText.setPosition(transform.sprite.x, transform.sprite.y + 80);
            healthText.setText(`HP: ${health.currentHealth}`);

            // Update color based on health
            if (health.currentHealth === 2) {
                healthText.setColor('#ffff00'); // Yellow
            } else if (health.currentHealth === 1) {
                healthText.setColor('#ff0000'); // Red
            } else if (health.currentHealth >= 3) {
                healthText.setColor('#00ff00'); // Green
            }
        }

        // Destroy asteroid if health reaches 0
        if (health.isDead() && transform.sprite.active) {
            this.destroyAsteroid(entity, transform, asteroid.asteroidId);
        }
    }

    /**
     * Creates health text display for an asteroid.
     *
     * @param asteroidId - Unique identifier for the asteroid
     * @param transform - Transform component containing sprite position
     * @param health - Health component with current health value
     */
    private createHealthText(
        asteroidId: string,
        transform: TransformComponent,
        health: HealthComponent
    ): void {
        const healthText = this.scene.add
            .text(transform.sprite.x, transform.sprite.y + 80, `HP: ${health.currentHealth}`, {
                fontSize: '16px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 4, y: 2 },
            })
            .setOrigin(0.5)
            .setVisible(GameConfig.debug.showAsteroidHealth);

        this.healthTexts.set(asteroidId, healthText);
    }

    /**
     * Plays a flash effect on the asteroid sprite.
     *
     * @param sprite - The asteroid sprite to flash
     */
    public flashAsteroid(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.scene.tweens.add({
            targets: sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 1,
        });
    }

    /**
     * Destroys an asteroid with explosion animation.
     *
     * @param entity - The asteroid entity to destroy
     * @param transform - Transform component containing sprite
     * @param asteroidId - Unique identifier for the asteroid
     */
    private destroyAsteroid(entity: Entity, transform: TransformComponent, asteroidId: string): void {

        // Prevent double-destroy
        if (!transform.sprite.active) {
            return;
        }

        // Play big explosion at asteroid's position
        const explosion = this.scene.add.sprite(transform.sprite.x, transform.sprite.y, 'kaboom-big');
        explosion.play('explode-big');
        explosion.once('animationcomplete', () => explosion.destroy());

        // Destroy sprite
        transform.sprite.destroy();

        // Cleanup health text
        this.cleanupHealthText(asteroidId);
        
        this.scene.entityManager.removeEntity(entity.id);
    }

    /**
     * Removes health text display for an asteroid.
     *
     * @param asteroidId - Unique identifier for the asteroid
     */
    private cleanupHealthText(asteroidId: string): void {
        const healthText = this.healthTexts.get(asteroidId);
        if (healthText) {
            healthText.destroy();
            this.healthTexts.delete(asteroidId);
        }
    }

    /**
     * Cleanup method called when system is removed.
     * Destroys all health text displays.
     */
    public destroy(): void {
        this.healthTexts.forEach(text => text.destroy());
        this.healthTexts.clear();
    }
}
