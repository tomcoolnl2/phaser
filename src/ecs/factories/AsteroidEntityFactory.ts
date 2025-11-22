import { GameConfig } from '@shared/config';
import { AsteroidDTO, AsteroidSize } from '@shared/dto/Asteroid.dto';
import { Entity } from '@/ecs/core/Entity';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { HealthComponent } from '@/ecs/components/HealthComponent';
import { AsteroidComponent } from '@/ecs/components/AsteroidComponent';
import { GameScene } from '@/scenes/GameScene';

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
    /**
     * Constructs a new AsteroidEntityFactory.
     *
     * @param scene - The current GameScene instance (used for ECS entity management).
     */
    constructor(private scene: GameScene) {}

    /**
     * Returns the scale and collision radius for an asteroid based on its size.
     * @param size - AsteroidSize or string identifier
     */
    private getScale(size: AsteroidSize): number {
        let scale = 1;
        switch (size) {
            case AsteroidSize.SMALL:
                scale = 0.5;
                break;
            case AsteroidSize.MEDIUM:
                scale = 0.75;
                break;
            case AsteroidSize.LARGE:
            default:
                scale = 1;
                break;
        }
        return scale;
    }

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

        const entity = this.scene.entityManager.createEntity();
        const sprite = this.scene.physics.add.sprite(dto.x, dto.y, 'asteroid').setOrigin(0.5, 0.5);
        sprite.setCollideWorldBounds(false);
        sprite.setImmovable(true);
        sprite.setMaxVelocity(GameConfig.asteroid.maxVelocity);
        sprite.setData('id', dto.id);
        sprite.play('asteroid-spin');

        const scale = this.getScale(dto.size);
        sprite.setScale(scale);

        entity.addComponent(new TransformComponent(sprite));
        entity.addComponent(new HealthComponent(dto.health));
        // entity.addComponent(new ColliderComponent(collisionRadius, CollisionLayer.ASTEROID));
        entity.addComponent(new AsteroidComponent(dto.id));

        return entity;
    }
}
