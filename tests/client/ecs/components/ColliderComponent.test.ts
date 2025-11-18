import { describe, it, expect } from 'vitest';
import { ColliderComponent } from '@/ecs/components/ColliderComponent';
import { CollisionLayer } from '@shared/types';

describe('ColliderComponent', () => {
    it('constructs with given radius, layer, and collidesWithLayers', () => {
        const collider = new ColliderComponent(10, CollisionLayer.PLAYER, [CollisionLayer.ENEMY, CollisionLayer.ASTEROID]);
        expect(collider.radius).toBe(10);
        expect(collider.layer).toBe(CollisionLayer.PLAYER);
        expect(collider.collidesWithLayers).toEqual([CollisionLayer.ENEMY, CollisionLayer.ASTEROID]);
    });

    it('shouldCollideWith returns true for included layer', () => {
        const collider = new ColliderComponent(10, CollisionLayer.PLAYER, [CollisionLayer.ENEMY]);
        expect(collider.shouldCollideWith(CollisionLayer.ENEMY)).toBe(true);
    });

    it('shouldCollideWith returns false for not included layer', () => {
        const collider = new ColliderComponent(10, CollisionLayer.PLAYER, [CollisionLayer.ASTEROID]);
        expect(collider.shouldCollideWith(CollisionLayer.ENEMY)).toBe(false);
    });
});
