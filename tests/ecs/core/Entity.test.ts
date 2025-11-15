import { describe, it, expect, beforeEach } from 'vitest';
import { Entity } from '@/ecs/core/Entity';
import { Component } from '@/ecs/core/Component';

class DummyComponent extends Component {
    constructor(public value: number) {
        super();
    }
}

describe('Entity', () => {
    let entity: Entity;
    let comp: DummyComponent;

    beforeEach(() => {
        entity = new Entity('test');
        comp = new DummyComponent(42);
    });

    it('constructs with correct id', () => {
        expect(entity.id).toBe('test');
        expect(entity.active).toBe(true);
    });

    it('can add and get a component', () => {
        entity.addComponent(comp);
        expect(entity.getComponent(DummyComponent)).toBe(comp);
    });

    it('hasComponent returns true if present', () => {
        entity.addComponent(comp);
        expect(entity.hasComponent(DummyComponent)).toBe(true);
    });

    it('hasComponent returns false if not present', () => {
        expect(entity.hasComponent(DummyComponent)).toBe(false);
    });

    it('can remove a component', () => {
        entity.addComponent(comp);
        entity.removeComponent(DummyComponent);
        expect(entity.hasComponent(DummyComponent)).toBe(false);
    });

    it('getAllComponents returns all components', () => {
        entity.addComponent(comp);
        expect(entity.getAllComponents()).toContain(comp);
    });

    it('destroy deactivates and clears components', () => {
        entity.addComponent(comp);
        entity.destroy();
        expect(entity.active).toBe(false);
        expect(entity.getAllComponents().length).toBe(0);
    });
});
