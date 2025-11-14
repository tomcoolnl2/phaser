import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AsteroidSystem } from '@/ecs/systems/AsteroidSystem';

const mockSprite = { active: true, x: 0, y: 0, destroy: vi.fn() };
const mockText = { setPosition: vi.fn(), setText: vi.fn(), setColor: vi.fn(), setVisible: vi.fn(), destroy: vi.fn() };
const mockAdd = { text: vi.fn(() => mockText), sprite: vi.fn(() => mockSprite) };
const mockTweens = { add: vi.fn() };
const mockEntityManager = { queryEntities: vi.fn(() => []), removeEntity: vi.fn() };
const mockScene = { add: mockAdd, tweens: mockTweens, entityManager: mockEntityManager } as any;

describe('AsteroidSystem', () => {
    let system: AsteroidSystem;

    beforeEach(() => {
        system = new AsteroidSystem(mockScene);
    });

    it('calls tweens.add in flashAsteroid', () => {
        system.flashAsteroid(mockSprite as any);
        expect(mockTweens.add).toHaveBeenCalled();
    });

    it('destroyAsteroidById does nothing if not found', () => {
        mockEntityManager.queryEntities.mockReturnValue([]);
        expect(() => system.destroyAsteroidById('nope')).not.toThrow();
    });
});
