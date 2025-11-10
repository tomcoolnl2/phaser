import { describe, it, expect, beforeEach } from 'vitest';
import { Entity, Component } from '../../src/ecs';

// Simple test component
class TestComponent extends Component {
    constructor(public value: number) {
        super();
    }
}

class AnotherComponent extends Component {
    constructor(public name: string) {
        super();
    }
}

describe('Entity', () => {
    let entity: Entity;

    beforeEach(() => {
        entity = new Entity('test-entity');
    });

    describe('initialization', () => {
        it('should create an entity with a custom name', () => {
            expect(entity.id).toBe('test-entity');
        });

        it('should create an entity with a generated ID if no name provided', () => {
            const autoEntity = new Entity();
            expect(autoEntity.id).toMatch(/^entity_\d+$/);
        });

        it('should start as active', () => {
            expect(entity.active).toBe(true);
        });

        it('should start with no components', () => {
            expect(entity.getAllComponents()).toHaveLength(0);
        });
    });

    describe('component management', () => {
        it('should add a component', () => {
            const component = new TestComponent(42);
            entity.addComponent(component);

            expect(entity.hasComponent(TestComponent)).toBe(true);
            expect(entity.getComponent(TestComponent)).toBe(component);
        });

        it('should support method chaining when adding components', () => {
            const result = entity.addComponent(new TestComponent(10)).addComponent(new AnotherComponent('test'));

            expect(result).toBe(entity);
            expect(entity.hasComponent(TestComponent)).toBe(true);
            expect(entity.hasComponent(AnotherComponent)).toBe(true);
        });

        it('should remove a component', () => {
            const component = new TestComponent(42);
            entity.addComponent(component);

            entity.removeComponent(TestComponent);

            expect(entity.hasComponent(TestComponent)).toBe(false);
            expect(entity.getComponent(TestComponent)).toBeUndefined();
        });

        it('should get a specific component', () => {
            const component = new TestComponent(99);
            entity.addComponent(component);

            const retrieved = entity.getComponent(TestComponent);

            expect(retrieved).toBe(component);
            expect(retrieved?.value).toBe(99);
        });

        it('should return undefined for non-existent component', () => {
            const result = entity.getComponent(TestComponent);
            expect(result).toBeUndefined();
        });

        it('should get all components', () => {
            const comp1 = new TestComponent(1);
            const comp2 = new AnotherComponent('hello');

            entity.addComponent(comp1);
            entity.addComponent(comp2);

            const components = entity.getAllComponents();

            expect(components).toHaveLength(2);
            expect(components).toContain(comp1);
            expect(components).toContain(comp2);
        });

        it('should check if entity has a component', () => {
            expect(entity.hasComponent(TestComponent)).toBe(false);

            entity.addComponent(new TestComponent(5));

            expect(entity.hasComponent(TestComponent)).toBe(true);
        });

        it('should handle multiple components of different types', () => {
            entity.addComponent(new TestComponent(100));
            entity.addComponent(new AnotherComponent('multi'));

            expect(entity.hasComponent(TestComponent)).toBe(true);
            expect(entity.hasComponent(AnotherComponent)).toBe(true);
            expect(entity.getComponent(TestComponent)?.value).toBe(100);
            expect(entity.getComponent(AnotherComponent)?.name).toBe('multi');
        });
    });

    describe('active state', () => {
        it('should start as active', () => {
            expect(entity.active).toBe(true);
        });

        it('should allow setting active state directly', () => {
            entity.active = false;
            expect(entity.active).toBe(false);

            entity.active = true;
            expect(entity.active).toBe(true);
        });
    });

    describe('destroy', () => {
        it('should clear all components on destroy', () => {
            entity.addComponent(new TestComponent(1));
            entity.addComponent(new AnotherComponent('test'));

            entity.destroy();

            expect(entity.getAllComponents()).toHaveLength(0);
            expect(entity.hasComponent(TestComponent)).toBe(false);
            expect(entity.hasComponent(AnotherComponent)).toBe(false);
        });

        it('should deactivate entity on destroy', () => {
            entity.destroy();
            expect(entity.active).toBe(false);
        });
    });
});
