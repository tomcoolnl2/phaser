import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { TransformComponent } from '../components/TransformComponent';
import { PickupComponent } from '../components/PickupComponent';
import { ComponentClass } from '../core/Component';

/**
 * System that manages pickup animations and visual effects.
 *
 * Handles:
 * - Floating animation (up/down motion)
 * - Rotation animation
 * - Particle effects
 * - Cleanup when pickup is destroyed
 *
 * Note: Collection detection is handled in GameScene via collision logic
 * since it requires checking distance to player entities.
 *
 * Requires entities to have: TransformComponent, PickupComponent
 *
 * @example
 * ```typescript
 * const pickupSystem = new PickupSystem(scene);
 * entityManager.addSystem(pickupSystem);
 * ```
 */
export class PickupSystem extends System {
    /** Track tweens for cleanup */
    private tweens: Map<Entity, Phaser.Tweens.Tween[]> = new Map();

    /**
     * Returns the components required by this system.
     */
    public getRequiredComponents(): ComponentClass[] {
        return [TransformComponent, PickupComponent];
    }

    /**
     * Updates a single pickup entity.
     * Initializes animations on first update, then checks if sprite is still active.
     *
     * @param entity - The pickup entity to update
     * @param _deltaTime - Time elapsed since last frame (unused)
     */
    public update(entity: Entity, _deltaTime: number): void {
        const transform = entity.getComponent(TransformComponent)!;
        const pickup = entity.getComponent(PickupComponent)!;

        // Initialize animations on first update if not already done
        if (!pickup.particles && transform.sprite.active) {
            this.initializePickup(entity, transform, pickup);
        }

        // Check if sprite was destroyed
        if (!transform.sprite.active) {
            this.cleanupPickup(entity, pickup);
        }
    }

    /**
     * Initializes animations and particle effects for a pickup.
     *
     * @param entity - The pickup entity
     * @param transform - The transform component
     * @param pickup - The pickup component
     */
    private initializePickup(entity: Entity, transform: TransformComponent, pickup: PickupComponent): void {
        // Create particle effect
        pickup.particles = this.scene.add.particles(
            transform.sprite.x,
            transform.sprite.y,
            'dust',
            {
                speed: 20,
                scale: { start: 0.3, end: 0 },
                alpha: { start: 0.8, end: 0 },
                lifespan: 1000,
                frequency: 100,
            }
        );

        // Add floating animation
        const floatTween = this.scene.tweens.add({
            targets: transform.sprite,
            y: transform.sprite.y - 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                // Update particles to follow sprite
                if (pickup.particles) {
                    pickup.particles.setPosition(transform.sprite.x, transform.sprite.y);
                }
            },
        });

        // Add rotation animation
        const rotateTween = this.scene.tweens.add({
            targets: transform.sprite,
            angle: 360,
            duration: 2000,
            repeat: -1,
        });

        // Store tweens for cleanup
        this.tweens.set(entity, [floatTween, rotateTween]);
    }

    /**
     * Called when an entity is removed from this system.
     * Cleans up animations and particle effects.
     *
     * @param entity - The pickup entity being removed
     */
    public onEntityRemoved(entity: Entity): void {
        const pickup = entity.getComponent(PickupComponent);
        if (pickup) {
            this.cleanupPickup(entity, pickup);
        }
    }

    /**
     * Cleans up animations and particle effects for a pickup.
     *
     * @param entity - The pickup entity
     * @param pickup - The pickup component
     */
    private cleanupPickup(entity: Entity, pickup: PickupComponent): void {
        // Stop and remove tweens
        const entityTweens = this.tweens.get(entity);
        if (entityTweens) {
            entityTweens.forEach(tween => {
                if (tween.isPlaying()) {
                    tween.stop();
                }
                tween.remove();
            });
            this.tweens.delete(entity);
        }

        // Destroy particles
        if (pickup.particles) {
            pickup.particles.destroy();
            pickup.particles = null;
        }
    }

    /**
     * Cleanup method called when system is removed.
     * Stops all tweens and destroys all particle emitters.
     */
    public destroy(): void {
        this.tweens.forEach(tweenArray => {
            tweenArray.forEach(tween => {
                if (tween.isPlaying()) {
                    tween.stop();
                }
                tween.remove();
            });
        });
        this.tweens.clear();
    }
}
