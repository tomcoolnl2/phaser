import { GameConfig } from '@shared/config';
import { System } from '@/ecs/core/System';
import { Entity } from '@/ecs/core/Entity';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { ComponentClass, Component } from '@/ecs/core/Component';

/**
 * WeaponSystem - Handles weapon firing and bullet spawning.
 *
 * This system checks if the trigger is pulled (via WeaponComponent.triggerPulled,
 * set by InputSystem) and spawns bullets if the weapon can fire. It manages:
 * - Fire rate limiting
 * - Ammunition consumption
 * - Bullet pooling from Phaser groups
 * - Bullet positioning and velocity
 * - Bullet rotation to match firing direction
 * - Automatic bullet cleanup after 2 seconds
 *
 * @example
 * ```typescript
 * const weaponSystem = new WeaponSystem(scene);
 * entityManager.addSystem(weaponSystem);
 * // Entities with Transform + Weapon components can now fire
 * ```
 */
export class WeaponSystem extends System {
    /**
     *  Specifies required components: PlayerComponent and WeaponComponent.
     * @returns The array of required component classes.
     */
    public getRequiredComponents(): ComponentClass<Component>[] {
        return [TransformComponent, WeaponComponent];
    }

    public update(entity: Entity, _deltaTime: number): void {
        const transform = entity.getComponent(TransformComponent);
        const weapon = entity.getComponent(WeaponComponent);

        if (!transform?.sprite || !weapon?.triggerPulled) return;

        // Check if weapon can fire
        if (!weapon.canFire()) return;

        // Fire weapon
        this.fireWeapon(transform, weapon);
    }

    private fireWeapon(transform: TransformComponent, weapon: WeaponComponent): void {

        weapon.fire();

        const sprite = transform.sprite;

        // Get bullet from pool using dynamic sprite key
        console.log(`[Client] [WeaponSystem] Firing bullet with sprite: ${weapon.bulletSpriteKey}`);
        const bullet = weapon.bullets.get(sprite.x, sprite.y, weapon.bulletSpriteKey) as Phaser.Physics.Arcade.Sprite;
        if (bullet) {
            // Explicitly set the texture to ensure it's correct (Phaser pool reuse can cause issues)
            bullet.setTexture(weapon.bulletSpriteKey);
            bullet.setActive(true);
            bullet.setVisible(true);

            // Rotate bullet to match ship direction (add 90° offset since bullet sprite points up)
            bullet.setRotation(sprite.rotation + Math.PI / 2);

            // Set bullet velocity based on ship rotation
            this.scene.physics.velocityFromRotation(sprite.rotation, weapon.bulletSpeed, bullet.body!.velocity);

            // Store damage in bullet data for collision system
            bullet.setData('damage', weapon.damage);

            // Only deactivate bullet if it leaves the play area
            const { width, height } = GameConfig.playArea;
            const threshold = 64;
            const bounds = { xMin: -threshold, xMax: width + threshold, yMin: -threshold, yMax: height + threshold };
            bullet.update = function () {
                if (
                    this.active && (
                        this.x < bounds.xMin ||
                        this.x > bounds.xMax ||
                        this.y < bounds.yMin ||
                        this.y > bounds.yMax
                    )
                ) {
                    this.setActive(false);
                    this.setVisible(false);
                }
            };

            // Optionally, keep the 2-second timeout as a backup
            this.scene.time.delayedCall(2000, () => {
                if (bullet.active) {
                    bullet.setActive(false);
                    bullet.setVisible(false);
                }
            });
        }
    }
}
