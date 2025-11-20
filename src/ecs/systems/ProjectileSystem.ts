import { Entity } from '@/ecs/core/Entity';
import { System } from '@/ecs/core/System';
import { ComponentClass, Component } from '@/ecs/core/Component';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { ColliderComponent } from '../components/ColliderComponent';


export class ProjectileSystem extends System {
    /**
     *  Specifies required components: PlayerComponent, TransformComponent and WeaponComponent.
     * @returns The array of required component classes.
     */
    public getRequiredComponents(): ComponentClass<Component>[] {
        return [TransformComponent, ColliderComponent];
    }

    /**
     * ECS update loop: fires weapon for entities with required components.
     *
     * @param entity - The entity to process.
     * @param _deltaTime - The frame delta time (unused).
     */
    public update(_entity: Entity, _deltaTime: number): void {
        // const transform = entity.getComponent(TransformComponent);
        // look at asteroid.update
    }
}
