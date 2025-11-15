import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayerEntityFactory } from '@/ecs/factories/PlayerEntityFactory';
import { EntityManager } from '@/ecs/core/EntityManager';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';

import { TransformComponent } from '@/ecs/components/TransformComponent';

const mockSprite = {
    setOrigin: () => mockSprite,
    setCollideWorldBounds: () => mockSprite,
    setBounce: () => mockSprite,
    setDamping: () => mockSprite,
    setDrag: () => mockSprite,
    setMaxVelocity: () => mockSprite,
    setAngularDrag: () => mockSprite,
    setData: () => mockSprite,
    setRotation: () => mockSprite,
    rotation: 0,
    x: 1,
    y: 2,
    texture: { key: 'sprite' },
};

const bulletGroup = {
    children: {
        getArray: () => [],
    },
} as unknown as Phaser.Physics.Arcade.Group;

const mockPhysics = {
    add: {
        sprite: vi.fn(() => mockSprite),
        group: vi.fn(() => bulletGroup),
    },
};
const mockScene = { physics: mockPhysics } as any;

describe('PlayerEntityFactory', () => {
    let factory: PlayerEntityFactory;
    let entityManager: EntityManager;

    beforeEach(() => {
        entityManager = new EntityManager(mockScene);
        factory = new PlayerEntityFactory(mockScene, entityManager);
        mockPhysics.add.sprite.mockClear();
        mockPhysics.add.group.mockClear();
    });

    it('creates a player entity for a local player (with WeaponComponent)', () => {
        const dto = new PlayerDTO('id', 'name', 1, 2, 'sprite', true);
        const entity = factory.fromDTO(dto);
        expect(entity).toBeDefined();
        expect(mockPhysics.add.sprite).toHaveBeenCalledWith(1, 2, 'sprite');
        expect(entity.getComponent(PlayerComponent)).toBeDefined();
        expect(entity.getComponent(WeaponComponent)).toBeDefined();
        expect(mockPhysics.add.group).toHaveBeenCalled();
    });

    it('creates a player entity for a remote player (no WeaponComponent)', () => {
        const dto = new PlayerDTO('id', 'name', 1, 2, 'sprite', false);
        const entity = factory.fromDTO(dto);
        expect(entity).toBeDefined();
        expect(entity.getComponent(PlayerComponent)).toBeDefined();
        expect(entity.getComponent(WeaponComponent)).toBeUndefined();
    });

    describe('toDTO', () => {
        it('converts a player entity to PlayerDTO', () => {
            const dto = new PlayerDTO('id', 'name', 1, 2, 'sprite', true, 3);
            const entity = factory.fromDTO(dto);
            const result = PlayerEntityFactory.toDTO(entity);
            expect(result).toBeInstanceOf(PlayerDTO);
            expect(result.id).toBe('id');
            expect(result.name).toBe('name');
            expect(result.x).toBe(1);
            expect(result.y).toBe(2);
            expect(result.spriteKey).toBe('sprite');
            expect(result.isLocal).toBe(true);
            expect(result.level).toBe(3);
        });

        it('throws if missing components', () => {
            const entity = entityManager.createEntity();
            expect(() => PlayerEntityFactory.toDTO(entity)).toThrow();
        });
    });
});
