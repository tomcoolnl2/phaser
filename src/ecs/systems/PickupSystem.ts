import * as Utils from '@shared/utils';
import { System } from '@/ecs/core/System';
import { Entity } from '@/ecs/core/Entity';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { PickupComponent } from '@/ecs/components/PickupComponent';
import { ComponentClass } from '@/ecs/core/Component';

/**
 * System that manages pickup animations.
 *
 * Handles:
 * - Floating animation (up/down motion)
 * - Rotation animation
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
        const sprite = transform.sprite;
        const { x, y } = sprite;

        // Warn if pickup is spawned out of bounds (should only happen on first update)
        if (!this.tweens.has(entity) && sprite.active) {
            // Check if pickup is already out of bounds on spawn
            if (Utils.isOutOfBounds({ x, y, bounds: this.scene.scale })) {
                console.warn(`[PickupSystem] Pickup spawned out of bounds at (${x.toFixed(1)}, ${y.toFixed(1)})`);
            }
            this.initializePickup(entity, transform);
        }

        // Destroy pickup if it moves fully off-screen (with margin)
        if (Utils.isOutOfBounds({ x, y, threshold: 16, bounds: this.scene.scale })) {
            console.log(`[PickupSystem] Destroying pickup for moving off-screen at (${x.toFixed(1)}, ${y.toFixed(1)})`);
            sprite.destroy();
            this.cleanupPickup(entity);
            // Remove the entity from the ECS/entity manager to stop further updates
            this.scene.entityManager.removeEntity(entity.id);
            return;
        }

        // Check if sprite was destroyed
        if (!sprite.active) {
            this.cleanupPickup(entity);
        }
    }

    /**
     * Initializes animations for a pickup.
     *
     * @param entity - The pickup entity
     * @param transform - The transform component
     */
    private initializePickup(entity: Entity, transform: TransformComponent): void {
        const floatTween = this.scene.tweens.add({
            targets: transform.sprite,
            y: transform.sprite.y - 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
        const rotateTween = this.scene.tweens.add({
            targets: transform.sprite,
            angle: 360,
            duration: 25000,
            repeat: -1,
        });
        this.tweens.set(entity, [floatTween, rotateTween]);
    }

    /**
     * Called when an entity is removed from this system.
     * Cleans up animations.
     *
     * @param entity - The pickup entity being removed
     */
    public onEntityRemoved(entity: Entity): void {
        this.cleanupPickup(entity);
    }

    /**
     * Cleans up animations for a pickup.
     *
     * @param entity - The pickup entity
     */
    private cleanupPickup(entity: Entity): void {
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
    }

    /**
     * Cleanup method called when system is removed.
     * Stops all tweens.
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
