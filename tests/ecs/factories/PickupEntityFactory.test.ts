import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PickupEntityFactory } from '@/ecs/factories/PickupEntityFactory';
import { EntityManager } from '@/ecs/core/EntityManager';
import { PickupDTO, PickupType } from '@shared/dto/Pickup.dto';

const mockSprite = {
	setOrigin: () => mockSprite,
	body: { velocity: {} },
};


const mockPhysics = {
	add: {
		sprite: vi.fn(() => mockSprite),
	},
	velocityFromRotation: vi.fn(),
};

const mockScene = { physics: mockPhysics, Math: { FloatBetween: () => 1, Between: () => 100 } } as any;

describe('PickupEntityFactory', () => {
	let factory: PickupEntityFactory;
	let entityManager: EntityManager;

	beforeEach(() => {
		entityManager = new EntityManager(mockScene);
		factory = new PickupEntityFactory(mockScene, entityManager);
	});

	it('creates a pickup entity with valid DTO', () => {
		const dto: PickupDTO = { id: 'p1', x: 10, y: 20, type: PickupType.AMMO, amount: 2 };
		const entity = factory.create(dto);
		expect(entity).toBeDefined();
		expect(mockPhysics.add.sprite).toHaveBeenCalledWith(10, 20, 'pickup');
	});

	it('throws error for invalid DTO', () => {
		// missing x
		const badDto = { id: 'p2', y: 2, type: PickupType.AMMO, amount: 3 } as PickupDTO;
		expect(() => factory.create(badDto)).toThrow();
	});
});
