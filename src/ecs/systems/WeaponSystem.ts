import * as Utils from '@shared/utils';
import { Entity } from '@/ecs/core/Entity';
import { System } from '@/ecs/core/System';
import { ComponentClass, Component } from '@/ecs/core/Component';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';

/**
 * WeaponSystem - Handles weapon firing and bullet spawning.
 *
 * This ECS system checks if the trigger is pulled (via WeaponComponent.triggerPulled,
 * set by InputSystem) and spawns bullets if the weapon can fire. It manages:
 * - Fire rate limiting
 * - Ammunition consumption
 * - Bullet pooling from Phaser groups
 * - Bullet positioning and velocity
 * - Bullet rotation to match firing direction
 * - Automatic bullet cleanup after 2 seconds
 * - Bullet damage scaling by provider level (PlayerComponent, TurretComponent, etc.)
 *
 * Provider components must implement WeaponLevelProvider<number> for damage scaling.
 * The system automatically finds the first such component on the entity.
 *
 * @example
 * ```typescript
 * const weaponSystem = new WeaponSystem(scene);
 * entityManager.addSystem(weaponSystem);
 * // Entities with Transform + Weapon components and a WeaponLevelProvider can now fire
 * ```
 */
export class WeaponSystem extends System {
    /**
     *  Specifies required components: PlayerComponent, TransformComponent and WeaponComponent.
     * @returns The array of required component classes.
     */
    public getRequiredComponents(): ComponentClass<Component>[] {
        return [TransformComponent, WeaponComponent];
    }

    /**
     * ECS update loop: fires weapon for entities with required components.
     *
     * @param entity - The entity to process.
     * @param _deltaTime - The frame delta time (unused).
     */
    public update(entity: Entity, _deltaTime: number): void {
        const transform = entity.getComponent(TransformComponent);
        const weapon = entity.getComponent(WeaponComponent);

        // Clean up bullets that have left the play area
        if (weapon?.bullets) {
            this.cleanupBullets(weapon);
        }

        if (!transform?.sprite || !weapon?.triggerPulled) {
            return;
        }

        if (!weapon.canFire()) {
            return;
        }

        this.fireWeapon(transform, weapon);
    }

    /**
     * Deactivates bullets that have left the play area to prevent pool exhaustion.
     * @param weapon The WeaponComponent containing the bullet group.
     */
    private cleanupBullets(weapon: WeaponComponent): void {
        const bullets = weapon.bullets.children.getArray() as Phaser.GameObjects.Sprite[];
        for (const bullet of bullets) {
            if (!bullet.active) {
                continue;
            }
            const x = bullet.x, y = bullet.y;
            if (Utils.isOutOfBounds({ x, y, threshold: 64 })) {
                bullet.setActive(false);
                bullet.setVisible(false);
            }
        }
    }

    /**
     * Fires a weapon for the given entity, spawning a bullet and applying damage scaling.
     *
     * @param transform - The entity's TransformComponent (position, rotation, sprite).
     * @param weapon - The WeaponComponent (firing logic, bullet pool, etc.).
     * @param levelProvider - The provider component implementing WeaponLevelProvider<number> (optional).
     *
     * Damage is scaled by the provider's level property if present, otherwise defaults to 1.
     */
    private fireWeapon(transform: TransformComponent, weapon: WeaponComponent): void {
        weapon.fire();
        const sprite = transform.sprite;

        // Get bullet from pool using dynamic sprite key
        console.info(`[Client] [WeaponSystem] Firing bullet with sprite: ${weapon.bulletSpriteKey}`);
        const bullet = weapon.bullets.get(sprite.x, sprite.y, weapon.bulletSpriteKey) as Phaser.Physics.Arcade.Sprite;

        // Debug: log pool status
        const activeCount = weapon.bullets.countActive(true);
        const totalCount = weapon.bullets.getLength ? weapon.bullets.getLength() : 'unknown';
        if (!bullet) {
            console.error('[WeaponSystem] Bullet pool exhausted or sprite missing:', {
                bulletSpriteKey: weapon.bulletSpriteKey,
                activeCount,
                totalCount,
                group: weapon.bullets,
            });
            return;
        }

        // Explicitly set the texture to ensure it's correct (Phaser pool reuse can cause issues)
        bullet.setTexture(weapon.bulletSpriteKey);
        bullet.setActive(true);
        bullet.setVisible(true);

        // Rotate bullet to match ship direction (add 90° offset since bullet sprite points up)
        bullet.setRotation(sprite.rotation + Math.PI / 2);

        // Set bullet velocity based on ship rotation
        this.scene.physics.velocityFromRotation(sprite.rotation, weapon.getAmmoSpeed(), bullet.body!.velocity);

        // No need to assign a custom update function; cleanup is handled centrally.
    }
}
