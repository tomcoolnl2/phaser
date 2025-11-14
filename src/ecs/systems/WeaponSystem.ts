import * as Utils from '@shared/utils';
import { Entity } from '@/ecs/core/Entity';
import { System } from '@/ecs/core/System';
import { ComponentClass, Component } from '@/ecs/core/Component';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { WeaponLevelProvider } from '@shared/model';

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
    /**
     * Specifies required components for weaponized entities.
     *
     * Entities must have TransformComponent and WeaponComponent to be processed by this system.
     * Provider components (e.g., PlayerComponent, TurretComponent) are optional and used for damage scaling.
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

        if (!transform?.sprite || !weapon?.triggerPulled) {
            return;
        }

        if (!weapon.canFire()) {
            return;
        }

        // Find the first component that implements WeaponLevelProvider<number>
        const levelProvider = this.findWeaponLevelProvider<number>(entity);
        this.fireWeapon(transform, weapon, levelProvider);
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
    private fireWeapon(transform: TransformComponent, weapon: WeaponComponent, levelProvider: WeaponLevelProvider<number> | undefined): void {
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

            // Apply damage scaling based on provider level
            const scaledDamage = this.getDamageForLevel(weapon.damage, levelProvider?.level ? (levelProvider?.level as number) : 1);
            bullet.setData('damage', scaledDamage);
            console.log(`[WeaponSystem] Bullet fired with damage: ${scaledDamage} (Level ${levelProvider?.level.toString()})`);

            // Only deactivate bullet if it leaves the play area
            bullet.update = function () {
                if (this.active && Utils.isOutOfBounds({ x: this.x, y: this.y, threshold: 64 })) {
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

    /**
     * Scales weapon damage by provider level.
     *
     * @param damage - The base weapon damage.
     * @param level - The provider's level (default 1).
     * @returns The scaled damage value.
     */
    private getDamageForLevel(damage: number, level: number): number {
        return damage * (1 + 0.5 * (level - 1));
    }

    /**
     * Finds the first component on the entity that implements WeaponLevelProvider<T>.
     *
     * @param entity - The entity to search.
     * @returns The provider component, or undefined if none found.
     */
    private findWeaponLevelProvider<T>(entity: Entity): WeaponLevelProvider<T> | undefined {
        for (const component of entity.getAllComponents()) {
            if (this.isWeaponLevelProvider(component)) {
                return component as WeaponLevelProvider<T>;
            }
        }
        return undefined;
    }

    /**
     * Type guard to check if a component implements WeaponLevelProvider<T>.
     *
     * @param component - The component to check.
     * @returns True if the component has a level property.
     */
    private isWeaponLevelProvider<T>(component: unknown): component is WeaponLevelProvider<T> {
        return typeof component === 'object' && component !== null && 'level' in component && typeof (component as { level: unknown }).level !== 'undefined';
    }
}
