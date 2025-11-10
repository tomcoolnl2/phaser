import { Component, ComponentClass } from './Component';

/**
 * Entity class
 * An entity is just a container for components with a unique ID
 */
export class Entity {
    private static nextId = 0;
    public readonly id: string;
    private components: Map<ComponentClass<Component>, Component> = new Map();
    public active: boolean = true;

    constructor(name?: string) {
        this.id = name || `entity_${Entity.nextId++}`;
    }

    /**
     * Add a component to this entity
     */
    public addComponent<T extends Component>(component: T): this {
        const componentClass = component.constructor as ComponentClass<T>;
        this.components.set(componentClass, component);
        return this;
    }

    /**
     * Get a component from this entity
     */
    public getComponent<T extends Component>(componentClass: ComponentClass<T>): T | undefined {
        return this.components.get(componentClass) as T | undefined;
    }

    /**
     * Check if entity has a component
     */
    public hasComponent<T extends Component>(componentClass: ComponentClass<T>): boolean {
        return this.components.has(componentClass);
    }

    /**
     * Remove a component from this entity
     */
    public removeComponent<T extends Component>(componentClass: ComponentClass<T>): void {
        this.components.delete(componentClass);
    }

    /**
     * Get all components
     */
    public getAllComponents(): Component[] {
        return Array.from(this.components.values());
    }

    /**
     * Destroy entity and clean up
     */
    public destroy(): void {
        this.active = false;
        this.components.clear();
    }
}
