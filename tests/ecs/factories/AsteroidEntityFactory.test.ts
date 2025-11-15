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
        factory = new AsteroidEntityFactory(mockScene, entityManager);
    });

    it('creates an asteroid entity with valid DTO', () => {
        const dto: AsteroidDTO = { id: 'a1', x: 10, y: 20, health: 5 };
        const entity = factory.create(dto);
        expect(entity).toBeDefined();
        expect(mockPhysics.add.sprite).toHaveBeenCalledWith(10, 20, 'asteroid');
    });

    it('throws error for invalid DTO', () => {
        // missing id
        const badDto = { x: 1, y: 2, health: 3 } as AsteroidDTO;
        expect(() => factory.create(badDto)).toThrow();
    });
});
