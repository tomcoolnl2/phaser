import { describe, it, expect, beforeEach } from 'vitest';

// Mock Phaser.Math.Linear for test environment
globalThis.Phaser = {
    Math: new Proxy({
        Linear: (a: number, b: number, t: number) => a + (b - a) * t,
        // Add stubs for all required properties to satisfy the type checker
        Average: () => 0,
        Bernstein: () => 0,
        Between: () => 0,
        CatmullRom: () => 0,
        CeilTo: () => 0,
        Clamp: () => 0,
        DegToRad: () => 0,
        Difference: () => 0,
        Distance: () => 0,
        // ... add other required methods as needed
    }, {
        get(target, prop) {
            if (prop in target) return target[prop as keyof typeof target];
            // Return a no-op function for any other Math method
            return () => 0;
        }
    }) as any // Cast to any to satisfy the type checker
} as any;
import { MovementSystem } from '@/ecs/systems/MovementSystem';
import { Entity } from '@/ecs/core/Entity';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { MovementComponent } from '@/ecs/components/MovementComponent';

const mockSprite = { 
    rotation: 0, 
    originX: 0.5,
    setOrigin: function(x: number) { this.originX = x; return this; },
    body: { 
        velocity: { x: 0, y: 0 }
    }
};

describe('MovementSystem', () => {
    let system: MovementSystem;
    let entity: Entity;
    let transform: TransformComponent;
    let movement: MovementComponent;

    beforeEach(() => {
        system = new MovementSystem({ game: { loop: { delta: 16 } }, physics: { velocityFromRotation: () => {} } } as any);
        entity = new Entity('e');
        transform = new TransformComponent(mockSprite as any);
        movement = new MovementComponent(10, 1, 0.9, 0.1);
        entity.addComponent(transform);
        entity.addComponent(movement);
    });

    it('applies thrust', () => {
        movement.thrustInput = 1;
        movement.canMove = true;
        system.update(entity, 0);
        expect(movement.currentVelocity).toBeGreaterThan(0);
    });

    it('applies brake', () => {
        movement.currentVelocity = 5;
        movement.brakeInput = true;
        movement.canMove = true;
        system.update(entity, 0);
        expect(movement.currentVelocity).toBeLessThan(5);
    });

    it('applies drift', () => {
        movement.currentVelocity = 5;
        movement.canMove = true;
        system.update(entity, 0);
        expect(movement.currentVelocity).toBeLessThan(5);
    });
});
