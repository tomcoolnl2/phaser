import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityManager } from '@/ecs/core/EntityManager';
import { Entity } from '@/ecs/core/Entity';
import { Component } from '@/ecs/core/Component';
import { System } from '@/ecs/core/System';
import { GameScene } from '@/scenes/GameScene';

const mockScene = {} as GameScene;

class DummySystem extends System {
	enabled = true;
	updated: Entity[] = [];
	getRequiredComponents() { return [DummyComponent]; }
	update(entity: Entity, delta: number) { this.updated.push(entity); }
	onEntityRemoved(entity: Entity) { this.removed = entity; }
	removed?: Entity;
}

class DummyComponent extends Component {
	constructor(public value: number) { 
        super();
    }
}

describe('EntityManager', () => {
	let manager: EntityManager;

	beforeEach(() => {
		manager = new EntityManager(mockScene);
	});

	it('creates and retrieves entities', () => {
		const entity = manager.createEntity('foo');
		expect(manager.getEntity(entity.id)).toBe(entity);
		expect(manager.getAllEntities()).toContain(entity);
		expect(manager.getEntityCount()).toBe(1);
	});

	it('adds and removes entities', () => {
		const entity = new Entity('bar');
		manager.addEntity(entity);
		expect(manager.getEntity(entity.id)).toBe(entity);
		expect(manager.removeEntity(entity.id)).toBe(true);
		expect(manager.getEntity(entity.id)).toBeUndefined();
	});

	it('removes non-existent entity returns false', () => {
		expect(manager.removeEntity('nope')).toBe(false);
	});

	it('can register and remove systems', () => {
		const system = new DummySystem(mockScene);
		manager.addSystem(system);
		manager.removeSystem(system);
	});

	it('update calls system update for matching entities', () => {
		const system = new DummySystem(mockScene);
		manager.addSystem(system);
		const entity = manager.createEntity('baz');
		entity.addComponent(new DummyComponent(1));
		manager.update(16);
		expect(system.updated).toContain(entity);
	});

	it('destroy clears all entities and systems', () => {
		manager.createEntity('a');
		manager.createEntity('b');
		manager.destroy();
		expect(manager.getEntityCount()).toBe(0);
		expect(manager.getAllEntities().length).toBe(0);
	});
});
