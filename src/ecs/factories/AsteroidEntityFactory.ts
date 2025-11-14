import Phaser from 'phaser';
import { GameConfig } from '@shared/config';
import { CollisionLayer } from '@shared/types';
import { EntityManager } from '@/ecs/core/EntityManager';
import { Entity } from '@/ecs/core/Entity';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { HealthComponent } from '@/ecs/components/HealthComponent';
import { ColliderComponent } from '@/ecs/components/ColliderComponent';
import { AsteroidComponent } from '@/ecs/components/AsteroidComponent';
import { AsteroidDTO, AsteroidDTOSchema } from '@shared/dto/AsteroidDTO';

/**
 * AsteroidEntityFactory - OOP ECS factory for asteroid entities.
 *
 * Usage:
 *   const factory = new AsteroidEntityFactory(scene, entityManager);
 *   const asteroid = factory.create({ id: 'asteroid-123', x: 400, y: 100, hp: 10 });
 *
 * The created entity includes:
 * - TransformComponent: Manages the asteroid sprite
 * - HealthComponent: Asteroid health (from DTO)
 * - ColliderComponent: Collision detection
 * - AsteroidComponent: Asteroid metadata (id)
 */
export class AsteroidEntityFactory {
    constructor(
        private scene: Phaser.Scene,
        private entityManager: EntityManager
    ) {}

    /**
     * Creates an asteroid entity with all necessary ECS components:
     * - TransformComponent: Manages the asteroid sprite
     * - HealthComponent: Asteroid health (from DTO)
     * - ColliderComponent: Collision detection
     * - AsteroidComponent: Asteroid metadata (id)
     *
     * @param dto - AsteroidDTO containing id, x, y, and hp
     * @throws Error if DTO is invalid (missing required fields)
     * @returns The newly created asteroid entity
     */
    public create(dto: AsteroidDTO): Entity {

        const result = AsteroidDTOSchema.safeParse(dto);
        if (!result.success) {
            throw new Error('Invalid AsteroidDTO: ' + result.error.message);
        }

        const entity = this.entityManager.createEntity();
        const sprite = this.scene.physics.add.sprite(dto.x, dto.y, 'asteroid').setOrigin(0.5, 0.5);
        sprite.setCollideWorldBounds(false);
        sprite.setImmovable(true);
        sprite.setMaxVelocity(GameConfig.asteroid.maxVelocity);
        sprite.setData('id', dto.id);
        sprite.play('asteroid-spin');
        entity.addComponent(new TransformComponent(sprite));
        entity.addComponent(new HealthComponent(dto.health));
        entity.addComponent(new ColliderComponent(GameConfig.asteroid.collisionRadius, CollisionLayer.ASTEROID));
        entity.addComponent(new AsteroidComponent(dto.id));
        
        return entity;
    }
}
