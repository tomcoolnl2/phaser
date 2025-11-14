import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { TransformComponent } from '../components/TransformComponent';
import { MovementComponent } from '../components/MovementComponent';
import { ComponentClass, Component } from '../core/Component';

/**
 * MovementSystem - Applies physics-based movement to entities.
 *
 * This system reads movement input from MovementComponent and applies it to the
 * entity's Phaser sprite body. It handles:
 * - Smooth rotation based on rotationInput
 * - Forward thrust in the direction the entity is facing
 * - Braking for rapid deceleration
 * - Drift physics for gradual slowdown
 *
 * Movement feels like a race car or space ship with momentum.
 *
 * @example
 * ```typescript
 * const movementSystem = new MovementSystem(scene);
 * entityManager.addSystem(movementSystem);
 * // Entities with Transform + Movement components will now move
 * ```
 */
export class MovementSystem extends System {
    /**
     * Returns the components required by this system.
     */
    public getRequiredComponents(): ComponentClass<Component>[] {
        return [TransformComponent, MovementComponent];
    }

    /**
     * Applies rotation, thrust, braking, and drag to the entity's physics body.
     * @param entity - Entity with transform and movement components
     * @param _deltaTime - Time since last frame (unused, Phaser handles timing)
     */
    public update(entity: Entity, _deltaTime: number): void {
        const transform = entity.getComponent(TransformComponent);
        const movement = entity.getComponent(MovementComponent);

        if (!transform?.sprite || !movement?.canMove) {
            return;
        }

        const sprite = transform.sprite;
        const body = sprite.body as Phaser.Physics.Arcade.Body;

        // Handle rotation
        if (movement.rotationInput !== 0) {
            movement.targetRotation += movement.rotationInput * movement.rotationSpeed;
        }
        sprite.rotation = movement.targetRotation;
        
        // Adjust sprite origin based on rotation input for sharper turns
        if (movement.rotationInput < 0) {
            sprite.setOrigin(0.6, 0.5); // pivot more to the right when turning left
        } else if (movement.rotationInput > 0) {
            sprite.setOrigin(0.4, 0.5); // pivot more to the left when turning right
        } else {
            sprite.setOrigin(0.5, 0.5); // center when not turning
        }

        // Handle thrust with smooth acceleration
        if (movement.thrustInput > 0) {
            // Use deltaTime for frame-rate independence
            const delta = this.scene.game.loop.delta / 1000; // seconds
            movement.currentVelocity += movement.acceleration * delta;
            if (movement.currentVelocity > movement.maxVelocity) {
                movement.currentVelocity = movement.maxVelocity;
            }
            this.scene.physics.velocityFromRotation(sprite.rotation, movement.currentVelocity, body.velocity);
        } else if (movement.brakeInput) {
            // Brake - stops quickly
            movement.currentVelocity *= 0.85;
            body.velocity.x *= 0.85;
            body.velocity.y *= 0.85;
        } else {
            // Drift - gradual slowdown
            movement.currentVelocity *= movement.drag;
            body.velocity.x *= movement.drag;
            body.velocity.y *= movement.drag;
        }
        // Clamp to zero if very slow
        if (Math.abs(movement.currentVelocity) < 0.01) {
            movement.currentVelocity = 0;
        }
    }
}
