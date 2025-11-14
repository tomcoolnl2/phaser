import { describe, it, expect, beforeEach } from 'vitest';
import { MovementSystem } from '@/ecs/systems/MovementSystem';
import { Entity } from '@/ecs/core/Entity';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { MovementComponent } from '@/ecs/components/MovementComponent';

const mockSprite = { 
    rotation: 0, 
    body: { 
        velocity: { x: 0, y: 0 }
    },
    setOrigin: () => mockSprite,
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
