import { Entity } from './Entity';
import { System } from './System';
import { Component, ComponentClass } from './Component';

/**
 * EntityManager
 * Central manager for entities and systems
 */
export class EntityManager {
    private entities: Map<string, Entity> = new Map();
    private systems: System[] = [];
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Create and register a new entity
     */
    createEntity(name?: string): Entity {
        const entity = new Entity(name);
        this.entities.set(entity.id, entity);
        return entity;
    }

    /**
     * Add an existing entity
     */
    addEntity(entity: Entity): void {
        this.entities.set(entity.id, entity);
    }

    /**
     * Get entity by ID
     */
    getEntity(id: string): Entity | undefined {
        return this.entities.get(id);
    }

    /**
     * Remove and destroy an entity
     */
    removeEntity(id: string): void {
        const entity = this.entities.get(id);
        if (entity) {
            entity.destroy();
            this.entities.delete(id);
        }
    }

    /**
     * Query entities with specific components
     */
    queryEntities(...componentClasses: ComponentClass<Component>[]): Entity[] {
        const results: Entity[] = [];

        this.entities.forEach(entity => {
            if (!entity.active) return;

            const hasAllComponents = componentClasses.every(componentClass => entity.hasComponent(componentClass));

            if (hasAllComponents) {
                results.push(entity);
            }
        });

        return results;
    }

    /**
     * Register a system
     */
    addSystem(system: System): void {
        this.systems.push(system);
    }

    /**
     * Remove a system
     */
    removeSystem(system: System): void {
        const index = this.systems.indexOf(system);
        if (index !== -1) {
            this.systems.splice(index, 1);
        }
    }

    /**
     * Update all systems
     */
    update(deltaTime: number): void {
        for (const system of this.systems) {
            if (!system.enabled) continue;

            const requiredComponents = system.getRequiredComponents();
            const matchingEntities = this.queryEntities(...requiredComponents);

            for (const entity of matchingEntities) {
                system.update(entity, deltaTime);
            }
        }
    }

    /**
     * Clean up all entities and systems
     */
    destroy(): void {
        this.entities.forEach(entity => entity.destroy());
        this.entities.clear();
        this.systems = [];
    }

    /**
     * Get all entities
     */
    getAllEntities(): Entity[] {
        return Array.from(this.entities.values());
    }

    /**
     * Get entity count
     */
    getEntityCount(): number {
        return this.entities.size;
    }
}
