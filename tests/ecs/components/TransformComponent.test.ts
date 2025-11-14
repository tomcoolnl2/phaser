import { describe, it, expect, beforeEach } from 'vitest';
import { TransformComponent } from '@/ecs/components/TransformComponent';

function createMockSprite() {
    return {
        x: 0,
        y: 0,
        rotation: 0
    } as Phaser.Physics.Arcade.Sprite;
}

describe('TransformComponent', () => {
    let sprite: Phaser.Physics.Arcade.Sprite;
    let transform: TransformComponent;

    beforeEach(() => {
        sprite = createMockSprite();
        transform = new TransformComponent(sprite);
    });

    it('gets and sets x', () => {
        transform.x = 42;
        expect(sprite.x).toBe(42);
        expect(transform.x).toBe(42);
    });

    it('gets and sets y', () => {
        transform.y = 99;
        expect(sprite.y).toBe(99);
        expect(transform.y).toBe(99);
    });

    it('gets and sets rotation', () => {
        transform.rotation = Math.PI;
        expect(sprite.rotation).toBe(Math.PI);
        expect(transform.rotation).toBe(Math.PI);
    });
});
