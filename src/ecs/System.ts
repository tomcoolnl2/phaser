import { Entity } from './Entity';
import { ComponentClass, Component } from './Component';

/**
 * Base System class
 * Systems contain logic and operate on entities with specific components
 */
export abstract class System {
    protected scene: Phaser.Scene;
    public enabled: boolean = true;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Define which components this system requires
     */
    abstract getRequiredComponents(): ComponentClass<Component>[];

    /**
     * Update logic for entities matching the required components
     */
    abstract update(entity: Entity, deltaTime: number): void;

    /**
     * Optional: Called when an entity is added to this system
     */
    onEntityAdded?(entity: Entity): void;

    /**
     * Optional: Called when an entity is removed from this system
     */
    onEntityRemoved?(entity: Entity): void;
}
