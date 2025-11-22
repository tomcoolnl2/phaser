import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AsteroidEntityFactory } from '@/ecs/factories/AsteroidEntityFactory';
import { EntityManager } from '@/ecs/core/EntityManager';
import { AsteroidDTO } from '@shared/dto/Asteroid.dto';

const mockSprite = {
    setOrigin: () => mockSprite,
    setCollideWorldBounds: () => mockSprite,
    setImmovable: () => mockSprite,
    setMaxVelocity: () => mockSprite,
    setData: () => mockSprite,
    play: () => mockSprite,
    setScale: () => mockSprite,
};

const mockPhysics = {
    add: {
        sprite: vi.fn(() => mockSprite),
    },
};

const mockScene = { physics: mockPhysics } as any;

describe('AsteroidEntityFactory', () => {
    let factory: AsteroidEntityFactory;
    let entityManager: EntityManager;

    beforeEach(() => {
        entityManager = new EntityManager(mockScene);
        mockScene.entityManager = entityManager;
        factory = new AsteroidEntityFactory(mockScene);
    });

    it('creates an asteroid entity with valid DTO', () => {
        const dto = new AsteroidDTO({ x: 10, y: 20, dx: 5, dy: 5, maxHealth: 100 });
        const entity = factory.create(dto);
        expect(entity).toBeDefined();
        expect(mockPhysics.add.sprite).toHaveBeenCalledWith(10, 20, 'asteroid');
    });
});
