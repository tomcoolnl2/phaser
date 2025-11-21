import { Entity } from '@/ecs/core/Entity';
import { System } from '@/ecs/core/System';
import { ComponentClass, Component } from '@/ecs/core/Component';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { ProjectileComponent } from '../components/ProjectileComponent';

export class ProjectileSystem extends System {
    /**
     *  Specifies required components: PlayerComponent, TransformComponent and WeaponComponent.
     * @returns The array of required component classes.
     */
    public getRequiredComponents(): ComponentClass<Component>[] {
        return [TransformComponent, ProjectileComponent];
    }

    /**
     * ECS update loop: fires weapon for entities with required components.
     *
     * @param entity - The entity to process.
     * @param _deltaTime - The frame delta time (unused).
     */
    public update(entity: Entity, _deltaTime: number): void {
        const transform = entity.getComponent(TransformComponent);
        const projectile = entity.getComponent(ProjectileComponent);
        if (!transform || !projectile) {
            return;
        }
    }

    public destroyProjectileById(projectileId: string): void {
        // Find the entity with this projectileId
        const entities = this.scene.entityManager.queryEntities(ProjectileComponent, TransformComponent);
        const entity = entities.find((e: Entity) => {
            const projectile = e.getComponent(ProjectileComponent);
            return projectile && projectile.id === projectileId;
        });
        if (!entity) {
            return;
        }
        const transform = entity.getComponent(TransformComponent);
        if (!transform) {
            return;
        }
        this.destroyProjectile(entity, transform);
    }

    private destroyProjectile(entity: Entity, transform: TransformComponent): void {
        // Prevent double-destroy
        if (!transform.sprite.active) {
            return;
        }

        transform.sprite.destroy();
        this.scene.entityManager.removeEntity(entity.id);
    }
}
