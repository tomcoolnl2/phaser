import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PickupSystem } from '@/ecs/systems/PickupSystem';
import { Entity } from '@/ecs/core/Entity';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { PickupComponent } from '@/ecs/components/PickupComponent';

// Minimal stub for Utils.isOutOfBounds
vi.mock('@shared/utils', () => ({
    isOutOfBounds: vi.fn(() => false),
}));
import * as Utils from '@shared/utils';

function makeSprite({ x = 0, y = 0, active = true } = {}) {
    return {
        x,
        y,
        active,
        destroy: vi.fn(),
    };
}

function makeScene({ scale = { width: 800, height: 600 }, tweens = {} } = {}) {
    return {
        scale,
        tweens: {
            add: vi.fn(() => ({
                isPlaying: vi.fn(() => true),
                stop: vi.fn(),
                remove: vi.fn(),
            })),
            ...tweens,
        },
        entityManager: {
            removeEntity: vi.fn(),
        },
    };
}

describe('PickupSystem', () => {
    let entity: Entity;
    let transform: TransformComponent;
    let pickup: PickupComponent;
    let scene: any;
    let system: PickupSystem;

    beforeEach(() => {
        entity = new Entity();
        transform = new TransformComponent(makeSprite() as unknown as Phaser.Physics.Arcade.Sprite);
        pickup = new PickupComponent();
        entity.addComponent(transform);
        entity.addComponent(pickup);
        transform.sprite = makeSprite() as any;
        scene = makeScene();
        system = new PickupSystem(scene);
        (Utils.isOutOfBounds as any).mockReset();
    });

    it('destroys pickup and cleans up if out of bounds after spawn', () => {
        (Utils.isOutOfBounds as any).mockReturnValueOnce(false).mockReturnValueOnce(true);
        system.update(entity, 0); // first update: not out of bounds
        system.update(entity, 0); // second update: out of bounds
        expect(transform.sprite.destroy).toHaveBeenCalled();
        expect(scene.entityManager.removeEntity).toHaveBeenCalledWith(entity.id);
    });

    it('cleans up tweens when sprite is destroyed', () => {
        (Utils.isOutOfBounds as any).mockReturnValue(false);
        system.update(entity, 0);
        transform.sprite.active = false;
        system.update(entity, 0);
        // Tweens should be cleaned up (tweens map should not have entity)
        expect((system as any).tweens.has(entity)).toBe(false);
    });
});
