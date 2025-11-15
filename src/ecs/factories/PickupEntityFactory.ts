import Phaser from 'phaser';
import { EntityManager } from '@/ecs/core/EntityManager';
import { Entity } from '@/ecs/core/Entity';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { MovementComponent } from '@/ecs/components/MovementComponent';
import { PickupComponent } from '@/ecs/components/PickupComponent';
import { PickupDTO } from '@shared/dto/Pickup.dto';
import { PickupSchema } from '@shared/dto/Pickup.schema';
import { z, ZodSafeParseResult } from 'zod';

/**
 * PickupEntityFactory - OOP ECS factory for pickups.
 *
 * Usage:
 *   const factory = new PickupEntityFactory(scene, entityManager);
 *   const pickup = factory.create(dto);
 */
export class PickupEntityFactory {
    constructor(
        private scene: Phaser.Scene,
        private entityManager: EntityManager
    ) {}

    /**
     * Creates a pickup entity from a PickupDTO.
     * @param dto - PickupDTO describing the pickup
     * @throws Error if DTO is invalid
     * @returns The newly created pickup entity
     */
    public create(dto: PickupDTO): Entity {
        const result: ZodSafeParseResult<z.infer<typeof PickupSchema>> = PickupSchema.safeParse(dto);
        if (!result.success) {
            throw new Error('Invalid PickupDTO: ' + result.error.message);
        }

        const entity = this.entityManager.createEntity();

        // Create pickup sprite
        const sprite = this.scene.physics.add.sprite(dto.x, dto.y, 'pickup').setOrigin(0.5, 0.5);

        // Give the pickup a random velocity
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.Between(80, 140); // adjust as needed
        this.scene.physics.velocityFromRotation(angle, speed, sprite.body.velocity);

        // Transform component - owns the sprite
        const transform = new TransformComponent(sprite);
        entity.addComponent(transform);

        // Add movement component for ECS movement system (optional, but for consistency)
        // These values are not used for input, but allow the MovementSystem to apply drag
        const movement = new MovementComponent(speed, 0, 0.99, 0);
        movement.targetRotation = angle;
        movement.canMove = false; // disables input-based movement
        entity.addComponent(movement);

        // Pickup component
        const pickup = new PickupComponent(dto.type, dto.amount);
        entity.addComponent(pickup);

        return entity;
    }
}
