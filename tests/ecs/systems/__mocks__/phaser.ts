import { vi } from 'vitest';

// Minimal mock for Phaser.Physics.Arcade.Sprite
export class MockArcadeSprite {
    x = 0;
    y = 0;
    rotation = 0;
    setPosition = vi.fn();
    setVelocity = vi.fn();
    setAcceleration = vi.fn();
    setAccelerationX = vi.fn();
    setAccelerationY = vi.fn();
    setAngularVelocity = vi.fn();
    setBounce = vi.fn();
    setCollideWorldBounds = vi.fn();
    setDamping = vi.fn();
    setDrag = vi.fn();
    setMaxVelocity = vi.fn();
    setAngularDrag = vi.fn();
    setData = vi.fn();
    destroy = vi.fn();
    anims = { play: vi.fn(), once: vi.fn() };
}

// Minimal mock for Phaser.Physics.Arcade.Group
export class MockArcadeGroup {
    add = vi.fn();
    remove = vi.fn();
    getChildren = vi.fn(() => []);
}
