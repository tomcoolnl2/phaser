import { Component, ComponentClass } from '@/ecs/core/Component';

/**
 * Entity - A container for components in the ECS architecture.
 *
 * An Entity is simply a unique identifier with a collection of components attached to it.
 * It has no behavior of its own - all logic is handled by Systems that operate on entities
 * with specific component combinations.
 *
 * @example
 * ```typescript
 * const entity = new Entity('player');
 * entity.addComponent(new TransformComponent(sprite))
 *       .addComponent(new MovementComponent(100, 200));
 * ```
 */
export class Entity {
    //
    private static nextId = 0;

    /** Unique identifier for this entity */
    public readonly id: string;

    /** Map of component classes to component instances */
    private components: Map<ComponentClass<Component>, Component> = new Map();

    /** Whether this entity is active and should be processed by systems */
    public active: boolean = true;

    /**
     * Creates a new Entity.
     * @param name - Optional name for the entity. If not provided, generates a unique ID.
     */
    constructor(name?: string) {
        this.id = name || `entity_${Entity.nextId++}`;
    }

    /**
     * Adds a component to this entity.
     * @param component - The component instance to add
     * @returns This entity for method chaining
     * @example
     * ```typescript
     * entity.addComponent(new TransformComponent(sprite))
     *       .addComponent(new HealthComponent(100));
     * ```
     */
    public addComponent<T extends Component>(component: T): this {
        const componentClass = component.constructor as ComponentClass<T>;
        this.components.set(componentClass, component);
        return this;
    }

    /**
     * Retrieves a component from this entity.
     * @param componentClass - The class of the component to retrieve
     * @returns The component instance if found, undefined otherwise
     * @example
     * ```typescript
     * const transform = entity.getComponent(TransformComponent);
     * if (transform) {
     *     console.log(transform.sprite.x, transform.sprite.y);
     * }
     * ```
     */
    public getComponent<T extends Component>(componentClass: ComponentClass<T>): T | undefined {
        return this.components.get(componentClass) as T | undefined;
    }

    /**
     * Checks if this entity has a specific component.
     * @param componentClass - The class of the component to check for
     * @returns True if the entity has the component, false otherwise
     */
    public hasComponent<T extends Component>(componentClass: ComponentClass<T>): boolean {
        return this.components.has(componentClass);
    }

    /**
     * Removes a component from this entity.
     * @param componentClass - The class of the component to remove
     */
    public removeComponent<T extends Component>(componentClass: ComponentClass<T>): void {
        this.components.delete(componentClass);
    }

    /**
     * Gets all components attached to this entity.
     * @returns Array of all component instances
     */
    public getAllComponents(): Component[] {
        return Array.from(this.components.values());
    }

    /**
     * Deactivates and clears all components from this entity.
     * After calling destroy(), the entity should not be used.
     */
    public destroy(): void {
        this.active = false;
        this.components.clear();
    }
}
