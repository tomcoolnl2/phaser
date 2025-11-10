import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityManager, Entity, Component, System } from '../../src/ecs';

// Mock Phaser Scene
const createMockScene = () =>
    ({
        add: {},
        physics: {},
        time: {},
        input: {},
    }) as unknown as Phaser.Scene;

// Test components
class PositionComponent extends Component {
    constructor(
        public x: number,
        public y: number
    ) {
        super();
    }
}

class VelocityComponent extends Component {
    constructor(
        public vx: number,
        public vy: number
    ) {
        super();
    }
}

class HealthComponent extends Component {
    constructor(public hp: number) {
        super();
    }
}

// Test system
class TestSystem extends System {
    public processedEntities: Entity[] = [];

    public getRequiredComponents() {
        return [PositionComponent, VelocityComponent];
    }

    public update(entity: Entity, _deltaTime: number): void {
        this.processedEntities.push(entity);
    }
}

describe('EntityManager', () => {
    let manager: EntityManager;
    let mockScene: Phaser.Scene;

    beforeEach(() => {
        mockScene = createMockScene();
        manager = new EntityManager(mockScene);
    });

    describe('entity creation', () => {
        it('should create an entity', () => {
            const entity = manager.createEntity('test');
            expect(entity).toBeInstanceOf(Entity);
            expect(entity.id).toBe('test');
        });

        it('should create an entity with auto-generated ID', () => {
            const entity = manager.createEntity();
            expect(entity.id).toBeDefined();
        });

        it('should register created entity', () => {
            const entity = manager.createEntity('registered');
            const retrieved = manager.getEntity('registered');
            expect(retrieved).toBe(entity);
        });
    });

    describe('entity management', () => {
        it('should add an existing entity', () => {
            const entity = new Entity('external');
            manager.addEntity(entity);

            const retrieved = manager.getEntity('external');
            expect(retrieved).toBe(entity);
        });

        it('should get an entity by ID', () => {
            const entity = manager.createEntity('findme');
            const found = manager.getEntity('findme');
            expect(found).toBe(entity);
        });

        it('should return undefined for non-existent entity', () => {
            const result = manager.getEntity('does-not-exist');
            expect(result).toBeUndefined();
        });

        it('should remove an entity', () => {
            const entity = manager.createEntity('removable');
            const removed = manager.removeEntity('removable');

            expect(removed).toBe(true);
            expect(manager.getEntity('removable')).toBeUndefined();
        });

        it('should return false when removing non-existent entity', () => {
            const removed = manager.removeEntity('not-there');
            expect(removed).toBe(false);
        });

        it('should call destroy on removed entity', () => {
            const entity = manager.createEntity('destroy-test');
            const destroySpy = vi.spyOn(entity, 'destroy');

            manager.removeEntity('destroy-test');

            expect(destroySpy).toHaveBeenCalled();
        });

        it('should get all entities', () => {
            manager.createEntity('entity1');
            manager.createEntity('entity2');
            manager.createEntity('entity3');

            const allEntities = manager.getAllEntities();
            expect(allEntities).toHaveLength(3);
        });

        it('should get entity count', () => {
            expect(manager.getEntityCount()).toBe(0);

            manager.createEntity('e1');
            manager.createEntity('e2');

            expect(manager.getEntityCount()).toBe(2);
        });
    });

    describe('entity queries', () => {
        it('should query entities by single component', () => {
            const entity1 = manager.createEntity('e1').addComponent(new PositionComponent(0, 0));
            manager.createEntity('e2').addComponent(new HealthComponent(100));
            const entity3 = manager.createEntity('e3').addComponent(new PositionComponent(10, 10));

            const results = manager.queryEntities(PositionComponent);

            expect(results).toHaveLength(2);
            expect(results).toContain(entity1);
            expect(results).toContain(entity3);
        });

        it('should query entities by multiple components', () => {
            const entity1 = manager.createEntity('e1').addComponent(new PositionComponent(0, 0)).addComponent(new VelocityComponent(1, 1));

            manager.createEntity('e2').addComponent(new PositionComponent(5, 5));

            const entity3 = manager.createEntity('e3').addComponent(new PositionComponent(10, 10)).addComponent(new VelocityComponent(2, 2));

            const results = manager.queryEntities(PositionComponent, VelocityComponent);

            expect(results).toHaveLength(2);
            expect(results).toContain(entity1);
            expect(results).toContain(entity3);
        });

        it('should not return inactive entities in queries', () => {
            const entity = manager.createEntity('inactive').addComponent(new PositionComponent(0, 0));

            entity.active = false;

            const results = manager.queryEntities(PositionComponent);
            expect(results).toHaveLength(0);
        });

        it('should return empty array when no entities match', () => {
            manager.createEntity('e1').addComponent(new HealthComponent(100));

            const results = manager.queryEntities(PositionComponent);
            expect(results).toHaveLength(0);
        });
    });

    describe('system management', () => {
        it('should add a system', () => {
            const system = new TestSystem(mockScene);
            manager.addSystem(system);

            // System should be registered (verified by update behavior)
            manager.createEntity('e1').addComponent(new PositionComponent(0, 0)).addComponent(new VelocityComponent(1, 1));

            manager.update(16);
            expect(system.processedEntities).toHaveLength(1);
        });

        it('should remove a system', () => {
            const system = new TestSystem(mockScene);
            manager.addSystem(system);
            manager.removeSystem(system);

            manager.createEntity('e1').addComponent(new PositionComponent(0, 0)).addComponent(new VelocityComponent(1, 1));

            manager.update(16);
            expect(system.processedEntities).toHaveLength(0);
        });
    });

    describe('update loop', () => {
        it('should update all systems with matching entities', () => {
            const system = new TestSystem(mockScene);
            manager.addSystem(system);

            const entity1 = manager.createEntity('e1').addComponent(new PositionComponent(0, 0)).addComponent(new VelocityComponent(1, 1));

            const entity2 = manager.createEntity('e2').addComponent(new PositionComponent(10, 10)).addComponent(new VelocityComponent(2, 2));

            manager.createEntity('e3').addComponent(new HealthComponent(100));

            manager.update(16);

            expect(system.processedEntities).toHaveLength(2);
            expect(system.processedEntities).toContain(entity1);
            expect(system.processedEntities).toContain(entity2);
        });

        it('should not update disabled systems', () => {
            const system = new TestSystem(mockScene);
            system.enabled = false;
            manager.addSystem(system);

            manager.createEntity('e1').addComponent(new PositionComponent(0, 0)).addComponent(new VelocityComponent(1, 1));

            manager.update(16);

            expect(system.processedEntities).toHaveLength(0);
        });

        it('should pass deltaTime to systems', () => {
            const deltaTime = 16.67;
            let receivedDelta = 0;

            class DeltaTestSystem extends System {
                public getRequiredComponents() {
                    return [PositionComponent];
                }

                public update(_entity: Entity, delta: number): void {
                    receivedDelta = delta;
                }
            }

            const system = new DeltaTestSystem(mockScene);
            manager.addSystem(system);
            manager.createEntity('e1').addComponent(new PositionComponent(0, 0));

            manager.update(deltaTime);

            expect(receivedDelta).toBe(deltaTime);
        });
    });

    describe('destroy', () => {
        it('should destroy all entities', () => {
            const entity1 = manager.createEntity('e1');
            const entity2 = manager.createEntity('e2');
            const spy1 = vi.spyOn(entity1, 'destroy');
            const spy2 = vi.spyOn(entity2, 'destroy');

            manager.destroy();

            expect(spy1).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });

        it('should clear all entities', () => {
            manager.createEntity('e1');
            manager.createEntity('e2');

            manager.destroy();

            expect(manager.getEntityCount()).toBe(0);
        });

        it('should clear all systems', () => {
            const system = new TestSystem(mockScene);
            manager.addSystem(system);

            manager.destroy();

            // Add entity after destroy - system should not process it
            manager.createEntity('e1').addComponent(new PositionComponent(0, 0)).addComponent(new VelocityComponent(1, 1));

            manager.update(16);
            expect(system.processedEntities).toHaveLength(0);
        });
    });
});
