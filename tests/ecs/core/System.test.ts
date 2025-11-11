import { describe, it, expect, beforeEach } from 'vitest';
import { System } from '@/ecs/core/System';
import { Entity } from '@/ecs/core/Entity';
import { Component } from '@/ecs/core/Component';

// Mock Phaser Scene
const createMockScene = () =>
    ({
        add: {},
        physics: {},
        time: {},
    }) as unknown as Phaser.Scene;

// Test components
class PositionComponent extends Component {
    constructor(public x: number, public y: number) {
        super();
    }
}

class VelocityComponent extends Component {
    constructor(public vx: number, public vy: number) {
        super();
    }
}

// Concrete system implementation for testing
class TestMovementSystem extends System {
    public updateCallCount = 0;
    public lastProcessedEntity?: Entity;
    public lastDeltaTime?: number;

    public getRequiredComponents() {
        return [PositionComponent, VelocityComponent];
    }

    public update(entity: Entity, deltaTime: number): void {
        this.updateCallCount++;
        this.lastProcessedEntity = entity;
        this.lastDeltaTime = deltaTime;

        // Actual movement logic
        const position = entity.getComponent(PositionComponent);
        const velocity = entity.getComponent(VelocityComponent);

        if (position && velocity) {
            position.x += velocity.vx * deltaTime;
            position.y += velocity.vy * deltaTime;
        }
    }
}

// System with lifecycle hooks
class SystemWithHooks extends System {
    public addedEntities: Entity[] = [];
    public removedEntities: Entity[] = [];

    public getRequiredComponents() {
        return [PositionComponent];
    }

    public update(_entity: Entity, _deltaTime: number): void {
        // No-op
    }

    public onEntityAdded(entity: Entity): void {
        this.addedEntities.push(entity);
    }

    public onEntityRemoved(entity: Entity): void {
        this.removedEntities.push(entity);
    }
}

describe('System', () => {
    let mockScene: Phaser.Scene;
    let system: TestMovementSystem;

    beforeEach(() => {
        mockScene = createMockScene();
        system = new TestMovementSystem(mockScene);
    });

    describe('initialization', () => {
        it('should create a system with a scene reference', () => {
            expect(system['scene']).toBe(mockScene);
        });

        it('should start enabled by default', () => {
            expect(system.enabled).toBe(true);
        });
    });

    describe('getRequiredComponents', () => {
        it('should return array of required component classes', () => {
            const required = system.getRequiredComponents();

            expect(required).toHaveLength(2);
            expect(required).toContain(PositionComponent);
            expect(required).toContain(VelocityComponent);
        });

        it('should return consistent results', () => {
            const result1 = system.getRequiredComponents();
            const result2 = system.getRequiredComponents();

            expect(result1).toEqual(result2);
        });
    });

    describe('update', () => {
        it('should process entities with required components', () => {
            const entity = new Entity('test-entity');
            entity.addComponent(new PositionComponent(0, 0));
            entity.addComponent(new VelocityComponent(1, 1));

            system.update(entity, 16);

            expect(system.updateCallCount).toBe(1);
            expect(system.lastProcessedEntity).toBe(entity);
        });

        it('should receive deltaTime parameter', () => {
            const entity = new Entity('test-entity');
            entity.addComponent(new PositionComponent(0, 0));
            entity.addComponent(new VelocityComponent(1, 1));
            const deltaTime = 16.67;

            system.update(entity, deltaTime);

            expect(system.lastDeltaTime).toBe(deltaTime);
        });

        it('should update entity state based on components', () => {
            const entity = new Entity('moving-entity');
            const position = new PositionComponent(100, 200);
            const velocity = new VelocityComponent(2, 3);

            entity.addComponent(position);
            entity.addComponent(velocity);

            system.update(entity, 10);

            expect(position.x).toBe(120); // 100 + (2 * 10)
            expect(position.y).toBe(230); // 200 + (3 * 10)
        });

        it('should process multiple updates correctly', () => {
            const entity = new Entity('entity');
            const position = new PositionComponent(0, 0);
            const velocity = new VelocityComponent(1, 1);

            entity.addComponent(position);
            entity.addComponent(velocity);

            system.update(entity, 10);
            system.update(entity, 10);
            system.update(entity, 10);

            expect(system.updateCallCount).toBe(3);
            expect(position.x).toBe(30);
            expect(position.y).toBe(30);
        });
    });

    describe('enabled state', () => {
        it('should allow enabling and disabling', () => {
            system.enabled = false;
            expect(system.enabled).toBe(false);

            system.enabled = true;
            expect(system.enabled).toBe(true);
        });

        it('should not prevent update from being called when disabled', () => {
            // Note: The EntityManager is responsible for checking enabled state
            // The System class itself doesn't prevent updates
            system.enabled = false;

            const entity = new Entity('entity');
            entity.addComponent(new PositionComponent(0, 0));
            entity.addComponent(new VelocityComponent(1, 1));

            system.update(entity, 16);

            // Update still gets called - EntityManager should filter disabled systems
            expect(system.updateCallCount).toBe(1);
        });
    });

    describe('lifecycle hooks', () => {
        let hookSystem: SystemWithHooks;

        beforeEach(() => {
            hookSystem = new SystemWithHooks(mockScene);
        });

        it('should support onEntityAdded hook', () => {
            expect(hookSystem.onEntityAdded).toBeDefined();

            const entity = new Entity('new-entity');
            hookSystem.onEntityAdded!(entity);

            expect(hookSystem.addedEntities).toContain(entity);
        });

        it('should support onEntityRemoved hook', () => {
            expect(hookSystem.onEntityRemoved).toBeDefined();

            const entity = new Entity('removed-entity');
            hookSystem.onEntityRemoved!(entity);

            expect(hookSystem.removedEntities).toContain(entity);
        });

        it('should handle multiple lifecycle events', () => {
            const entity1 = new Entity('entity1');
            const entity2 = new Entity('entity2');

            hookSystem.onEntityAdded!(entity1);
            hookSystem.onEntityAdded!(entity2);
            hookSystem.onEntityRemoved!(entity1);

            expect(hookSystem.addedEntities).toHaveLength(2);
            expect(hookSystem.removedEntities).toHaveLength(1);
        });
    });

    describe('scene access', () => {
        it('should provide access to scene for subclasses', () => {
            // Access protected scene property through System implementation
            expect(system['scene']).toBeDefined();
            expect(system['scene']).toBe(mockScene);
        });
    });

    describe('abstract class enforcement', () => {
        it('should require getRequiredComponents implementation', () => {
            // TypeScript enforces this at compile time
            // This test just verifies the method exists and works
            const components = system.getRequiredComponents();
            expect(Array.isArray(components)).toBe(true);
        });

        it('should require update implementation', () => {
            // TypeScript enforces this at compile time
            // This test verifies the method exists and is callable
            const entity = new Entity('test');
            expect(() => system.update(entity, 16)).not.toThrow();
        });
    });

    describe('edge cases', () => {
        it('should handle entities without required components gracefully', () => {
            const entity = new Entity('incomplete');
            entity.addComponent(new PositionComponent(0, 0));
            // Missing VelocityComponent

            // System should still be called (EntityManager filters)
            // but should handle missing component
            system.update(entity, 16);

            // Position shouldn't change without velocity
            const position = entity.getComponent(PositionComponent);
            expect(position?.x).toBe(0);
            expect(position?.y).toBe(0);
        });

        it('should handle zero deltaTime', () => {
            const entity = new Entity('entity');
            const position = new PositionComponent(100, 100);
            entity.addComponent(position);
            entity.addComponent(new VelocityComponent(5, 5));

            system.update(entity, 0);

            expect(position.x).toBe(100);
            expect(position.y).toBe(100);
        });

        it('should handle negative deltaTime', () => {
            const entity = new Entity('entity');
            const position = new PositionComponent(100, 100);
            entity.addComponent(position);
            entity.addComponent(new VelocityComponent(5, 5));

            system.update(entity, -10);

            expect(position.x).toBe(50); // Moves backward
            expect(position.y).toBe(50);
        });
    });
});
