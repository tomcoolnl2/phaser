import { System } from '../System';
import { Entity } from '../Entity';
import { TransformComponent } from '../components/TransformComponent';
import { MovementComponent } from '../components/MovementComponent';
import { ComponentClass, Component } from '../Component';

/**
 * MovementSystem - Processes movement inputs and updates physics
 * This system applies movement, rotation, and drag to entities
 */
export class MovementSystem extends System {
    public getRequiredComponents(): ComponentClass<Component>[] {
        return [TransformComponent, MovementComponent];
    }

    public update(entity: Entity, _deltaTime: number): void {
        const transform = entity.getComponent(TransformComponent);
        const movement = entity.getComponent(MovementComponent);

        if (!transform?.sprite || !movement?.canMove) return;

        const sprite = transform.sprite;
        const body = sprite.body as Phaser.Physics.Arcade.Body;

        // Handle rotation
        if (movement.rotationInput !== 0) {
            movement.targetRotation += movement.rotationInput * movement.rotationSpeed;
        }
        sprite.rotation = movement.targetRotation;

        // Handle thrust
        if (movement.thrustInput > 0) {
            // Set velocity in the direction the ship is facing
            this.scene.physics.velocityFromRotation(sprite.rotation, movement.maxVelocity, body.velocity);
        } else if (movement.brakeInput) {
            // Brake - stops quickly
            body.velocity.x *= 0.85;
            body.velocity.y *= 0.85;
        } else {
            // Drift - gradual slowdown
            body.velocity.x *= movement.drag;
            body.velocity.y *= movement.drag;
        }
    }
}
