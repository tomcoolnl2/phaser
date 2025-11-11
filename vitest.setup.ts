// vitest.setup.ts
import { vi } from 'vitest';

vi.mock('phaser', () => ({
    Scene: class {
        physics = {
            add: {
                sprite: (x: number, y: number, key: string) => {
                    // Mock sprite object with body and set* methods
                    const sprite = {
                        body: {
                            velocity: { x: 0, y: 0 },
                        },
                        setOrigin: vi.fn().mockReturnThis(),
                        setCollideWorldBounds: vi.fn().mockReturnThis(),
                        setBounce: vi.fn().mockReturnThis(),
                        setDamping: vi.fn().mockReturnThis(),
                        setDrag: vi.fn().mockReturnThis(),
                        setMaxVelocity: vi.fn().mockReturnThis(),
                        setAngularDrag: vi.fn().mockReturnThis(),
                        setData: vi.fn().mockReturnThis(),
                    };
                    return sprite;
                },
                group: vi.fn(),
            },
            velocityFromRotation: (angle: number, speed: number, velocity: { x: number, y: number }) => {
                // Simple mock: set velocity.x/y based on angle and speed
                velocity.x = Math.cos(angle) * speed;
                velocity.y = Math.sin(angle) * speed;
            },
        };
    },
    GameObjects: { Text: vi.fn() },
    Math: {
        Between: () => 0,
        FloatBetween: () => 0,
    },
    Physics: {
        Arcade: {
            Sprite: vi.fn(),
            Body: class {
                velocity = { x: 0, y: 0 };
            },
        },
    },
}));