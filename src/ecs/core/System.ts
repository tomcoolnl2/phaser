import { ComponentClass } from '@/ecs/core/Component';
import { Component } from '@/ecs/core/Component';
import { Entity } from '@/ecs/core/Entity';
import { GameScene } from '@/scenes/GameScene';

/**
 * System - Base class for all ECS systems.
 *
 * Systems contain the logic that operates on entities with specific components.
 * Each system defines which components it requires and implements update logic
 * that runs every frame for matching entities.
 *
 * Systems follow the Single Responsibility Principle - each system should handle
 * one specific aspect of game logic (movement, rendering, collision, etc.).
 *
 * @example
 * ```typescript
 * export class MovementSystem extends System {
 *     getRequiredComponents() {
 *         return [TransformComponent, VelocityComponent];
 *     }
 *
 *     update(entity: Entity, deltaTime: number) {
 *         const transform = entity.getComponent(TransformComponent);
 *         const velocity = entity.getComponent(VelocityComponent);
 *
 *         transform.x += velocity.x * deltaTime;
 *         transform.y += velocity.y * deltaTime;
 *     }
 * }
 * ```
 */
export abstract class System {
    /** Whether this system is currently enabled and should process entities */
    public enabled: boolean = true;

    /**
     * Creates a new System.
     * @param scene - The Phaser scene this system operates in
     */
    constructor(protected scene: GameScene) {
        this.scene = scene;
    }

    /**
     * Defines which components an entity must have for this system to process it.
     *
     * The EntityManager will only pass entities that have ALL of the required
     * components to this system's update method.
     *
     * @returns Array of component classes that entities must have
     *
     * @example
     * ```typescript
     * getRequiredComponents() {
     *     return [TransformComponent, MovementComponent, PlayerComponent];
     * }
     * ```
     */
    public abstract getRequiredComponents(): ComponentClass<Component>[];

    /**
     * Update logic executed every frame for each matching entity.
     *
     * @param entity - The entity to process
     * @param deltaTime - Time elapsed since last frame in milliseconds
     *
     * @example
     * ```typescript
     * update(entity: Entity, deltaTime: number) {
     *     const transform = entity.getComponent(TransformComponent);
     *     const movement = entity.getComponent(MovementComponent);
     *
     *     if (movement.isMoving) {
     *         transform.sprite.x += movement.velocity * deltaTime;
     *     }
     * }
     * ```
     */
    public abstract update(entity: Entity, deltaTime: number): void;

    /**
     * Optional lifecycle hook called when an entity is added to this system.
     * Useful for initialization or setting up resources.
     *
     * @param entity - The entity that was added
     */
    public onEntityAdded?(entity: Entity): void;

    /**
     * Optional lifecycle hook called when an entity is removed from this system.
     * Useful for cleanup or releasing resources.
     *
     * @param entity - The entity that was removed
     */
    public onEntityRemoved?(entity: Entity): void;
}
