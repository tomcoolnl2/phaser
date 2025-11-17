import Phaser from 'phaser';
import { EntityManager } from '@/ecs/core/EntityManager';
import { Entity } from '@/ecs/core/Entity';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { MovementComponent } from '@/ecs/components/MovementComponent';
import { PickupComponent } from '@/ecs/components/PickupComponent';
import { PickupDTO, PickupType } from '@shared/dto/Pickup.dto';
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
        // Validate the PickupDTO using Zod schema
        const result: ZodSafeParseResult<z.infer<typeof PickupSchema>> = PickupSchema.safeParse(dto);
        if (!result.success) {
            throw new Error('Invalid PickupDTO: ' + result.error.message);
        }

        const entity = this.entityManager.createEntity();

        // Choose sprite key based on pickup type
        let spriteKey = 'pickup';

        switch (dto.type) {
            case PickupType.AMMO:
                spriteKey = 'pickup-ammo';
                break;
            case PickupType.HEALTH:
                spriteKey = 'pickup-health';
                break;
            case PickupType.COIN:
                spriteKey = 'pickup-coin';
                break;
        }

        // Create pickup sprite
        const sprite = this.scene.physics.add.sprite(dto.x, dto.y, spriteKey).setOrigin(0.5, 0.5);

        // Play animation for coin pickup
        if (dto.type === PickupType.COIN) {
            sprite.play('pickup-coin-spin');
        }

        // Give the pickup a random velocity, except for coins
        let angle = 0;
        let speed = 0;
        if (dto.type !== PickupType.COIN) {
            angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            speed = Phaser.Math.Between(80, 140); // adjust as needed
            this.scene.physics.velocityFromRotation(angle, speed, sprite.body.velocity);
        }

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
        // For star, use points as value; for others, use amount
        let value = (dto as any).amount;
        if (dto.type === PickupType.COIN && 'points' in dto) {
            value = dto.points;
        }
        const pickup = new PickupComponent(dto.type, value);
        entity.addComponent(pickup);

        return entity;
    }
}
