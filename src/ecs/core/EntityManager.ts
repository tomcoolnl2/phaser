import { Entity } from '@/ecs/core/Entity';
import { System } from '@/ecs/core/System';
import { Component, ComponentClass } from '@/ecs/core/Component';
/**
 * EntityManager - Central coordinator for the ECS architecture.
 *
 * The EntityManager is responsible for:
 * - Creating and tracking all entities
 * - Registering and managing systems
 * - Querying entities by component composition
 * - Running the main update loop that processes all systems
 *
 * This is the main entry point for working with the ECS system. Typically,
 * you create one EntityManager per scene.
 *
 * @example
 * ```typescript
 * // In your Phaser scene
 * const entityManager = new EntityManager(this);
 *
 * // Register systems
 * entityManager.addSystem(new MovementSystem(this));
 * entityManager.addSystem(new RenderSystem(this));
 *
 * // Create entities
 * const player = entityManager.createEntity('player');
 * player.addComponent(new TransformComponent(sprite))
 *       .addComponent(new MovementComponent(100, 200));
 *
 * // In your scene's update method
 * update(time: number, delta: number) {
 *     entityManager.update(delta);
 * }
 * ```
 */
export class EntityManager {
    
    /** Map of entity IDs to entity instances */
    private entities: Map<string, Entity> = new Map();

    /** Array of registered systems that process entities */
    private systems: System[] = [];

    /** Reference to the Phaser scene (available for future entity/system operations) */
    private scene: Phaser.Scene;

    /**
     * Creates a new EntityManager.
     * @param scene - The Phaser scene this manager operates in
     */
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Creates and registers a new entity.
     * @param name - Optional name for the entity. If not provided, generates a unique ID.
     * @returns The newly created entity
     * @example
     * ```typescript
     * const player = entityManager.createEntity('player');
     * player.addComponent(new HealthComponent(100));
     * ```
     */
    public createEntity(name?: string): Entity {
        const entity = new Entity(name);
        this.addEntity(entity);
        return entity;
    }

    /**
     * Registers an existing entity with this manager.
     * @param entity - The entity to register
     */
    public addEntity(entity: Entity): void {
        this.entities.set(entity.id, entity);
    }

    /**
     * Retrieves an entity by its ID.
     * @param id - The unique identifier of the entity
     * @returns The entity if found, undefined otherwise
     */
    public getEntity(id: string): Entity | undefined {
        return this.entities.get(id);
    }

    /**
     * Removes and destroys an entity.
     *
     * This will notify all systems, call the entity's destroy() method, and remove it from the manager.
     * After removal, the entity should not be used.
     *
     * @param id - The unique identifier of the entity to remove
     * @returns True if the entity was found and removed, false if it didn't exist
     */
    public removeEntity(id: string): boolean {
        const entity = this.entities.get(id);
        if (entity) {
            // Notify systems that this entity is being removed
            for (const system of this.systems) {
                const requiredComponents = system.getRequiredComponents();
                const hasAllComponents = requiredComponents.every(componentClass => entity.hasComponent(componentClass));

                // Only notify systems that were tracking this entity
                if (hasAllComponents && system.onEntityRemoved) {
                    system.onEntityRemoved(entity);
                }
            }

            // Destroy the entity
            entity.destroy();
        }
        return this.entities.delete(id);
    }

    /**
     * Queries for entities that have all of the specified components.
     *
     * This is useful for finding entities that match specific criteria without
     * creating a dedicated system.
     *
     * @param componentClasses - Component classes that entities must have
     * @returns Array of entities that have all specified components
     * @example
     * ```typescript
     * // Find all entities with transform and health components
     * const damageable = entityManager.queryEntities(
     *     TransformComponent,
     *     HealthComponent
     * );
     * ```
     */
    public queryEntities(...componentClasses: ComponentClass<Component>[]): Entity[] {
        const results: Entity[] = [];

        this.entities.forEach(entity => {
            if (!entity.active) {
                return;
            }

            const hasAllComponents = componentClasses.every(componentClass => entity.hasComponent(componentClass));
            if (hasAllComponents) {
                results.push(entity);
            }
        });

        return results;
    }

    /**
     * Registers a system with this manager.
     *
     * Systems are executed in the order they are registered. Consider this when
     * adding systems with dependencies (e.g., InputSystem before MovementSystem).
     *
     * @param system - The system to register
     * @example
     * ```typescript
     * entityManager.addSystem(new InputSystem(this));
     * entityManager.addSystem(new MovementSystem(this));
     * ```
     */
    public addSystem(system: System): void {
        this.systems.push(system);
    }

    /**
     * Removes a system from this manager.
     * @param system - The system instance to remove
     */
    public removeSystem(system: System): void {
        const index = this.systems.indexOf(system);
        if (index !== -1) {
            this.systems.splice(index, 1);
        }
    }

    /**
     * Updates all registered systems.
     *
     * This should be called every frame from your Phaser scene's update method.
     * For each system, it queries for entities with the required components and
     * calls the system's update method for each matching entity.
     *
     * @param deltaTime - Time elapsed since last frame in milliseconds
     * @example
     * ```typescript
     * // In your Phaser scene
     * update(time: number, delta: number) {
     *     this.entityManager.update(delta);
     * }
     * ```
     */
    public update(deltaTime: number): void {
        for (const system of this.systems) {
            if (!system.enabled) {
                continue;
            }

            const requiredComponents = system.getRequiredComponents();
            const matchingEntities = this.queryEntities(...requiredComponents);

            for (const entity of matchingEntities) {
                // Skip entities that have been removed from the manager during this update cycle
                if (!this.entities.has(entity.id)) {
                    continue;
                }
                system.update(entity, deltaTime);
            }
        }
    }

    /**
     * Destroys all entities and clears all systems.
     *
     * This is typically called when transitioning to a new scene or cleaning up.
     * After calling destroy(), the EntityManager should not be used.
     */
    public destroy(): void {
        this.entities.forEach(entity => entity.destroy());
        this.entities.clear();
        this.systems = [];
    }

    /**
     * Gets all entities managed by this EntityManager.
     * @returns Array of all entity instances
     */
    public getAllEntities(): Entity[] {
        return Array.from(this.entities.values());
    }

    /**
     * Gets the total number of entities.
     * @returns Count of entities
     */
    public getEntityCount(): number {
        return this.entities.size;
    }
}
