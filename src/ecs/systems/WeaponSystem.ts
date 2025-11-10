import { System } from '../System';
import { Entity } from '../Entity';
import { TransformComponent } from '../components/TransformComponent';
import { WeaponComponent } from '../components/WeaponComponent';
import { ComponentClass, Component } from '../Component';

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
        console.log(`[WeaponSystem] Firing bullet with sprite: ${weapon.bulletSpriteKey}`);
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

            // Kill bullet after traveling off screen
            this.scene.time.delayedCall(2000, () => {
                if (bullet.active) {
                    bullet.setActive(false);
                    bullet.setVisible(false);
                }
            });
        }
    }
}
