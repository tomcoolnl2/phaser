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

        if (!transform?.sprite || !weapon?.triggerPulled) {
            return;
        }

        if (weapon.canFire()) {
            this.scene.emitPlayerShoot(weapon.dto);
        }
    }
}
