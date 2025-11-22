import { GameConfig } from '@shared/config';
import { CollisionLayer } from '@shared/types';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { WeaponDTO } from '@shared/dto/Weapon.dto';
import { Entity } from '@/ecs/core/Entity';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { MovementComponent } from '@/ecs/components/MovementComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { HealthComponent } from '@/ecs/components/HealthComponent';
import { ColliderComponent } from '@/ecs/components/ColliderComponent';
import { UpgradesComponent } from '@/ecs/components/UpgradesComponent';
import { ScoreComponent } from '@/ecs/components/ScoreComponent';
import { GameScene } from '@/scenes/GameScene';

/**
 * PlayerEntityFactory - OOP ECS factory for player entities.
 *
 * Usage:
 *   const factory = new PlayerEntityFactory(scene);
 *   const player = factory.create(playerDTO, spriteKey, isLocal);
 *
 * The created entity includes:
 * - TransformComponent: Manages the player sprite
 * - MovementComponent: Physics and controls
 * - WeaponComponent: Shooting and ammo (local players only)
 * - PlayerComponent: Player metadata and level
 * - HealthComponent: HP tracking
 * - ColliderComponent: Collision detection
 * - UpgradesComponent: Stat progression
 */
export class PlayerEntityFactory {
    //
    constructor(private scene: GameScene) {}

    /**
     * Creates a player entity with all necessary ECS components:
     * - TransformComponent: Manages the player sprite
     * - MovementComponent: Physics and controls
     * - WeaponComponent: Shooting and ammo (local players only)
     * - PlayerComponent: Player metadata and level
     * - HealthComponent: HP tracking
     * - ColliderComponent: Collision detection
     * - UpgradesComponent: Stat progression
     *
     * @param playerDTO - PlayerDTO instance containing player initialization data (id, name, position, level, ammo)
     * @returns The newly created player entity
     */
    public fromDTO(playerDTO: PlayerDTO): Entity {

        // Create the entity
        const entity = this.scene.entityManager.createEntity();
        const { id, name, x, y, spriteKey, isLocal, level, maxHealth } = playerDTO;

        // Create player sprite
        const sprite = this.scene.physics.add.sprite(x, y, spriteKey).setOrigin(0.5, 0.5);

        // Setup physics
        sprite.setCollideWorldBounds(true);
        sprite.setBounce(0);
        sprite.setDamping(true);
        sprite.setDrag(0.99);
        sprite.setMaxVelocity(GameConfig.player.maxVelocity);
        sprite.setAngularDrag(GameConfig.player.angularDrag);
        sprite.setData('id', id);

        // Transform component - owns the sprite
        const transform = new TransformComponent(sprite);
        entity.addComponent(transform);

        // Movement component
        const { maxVelocity, acceleration } = GameConfig.player;
        const movement = new MovementComponent(
            maxVelocity,
            acceleration,
            0.97, // drag value
            2.0 // rotation speed
        );
        movement.targetRotation = sprite.rotation;
        entity.addComponent(movement);

        // Player component
        const player = new PlayerComponent(id, name, isLocal, level);
        entity.addComponent(player);

        // Weapon component - only for local players
        if (isLocal) {
            const dto = new WeaponDTO({ ownerId: player.id, level });
            // Pass the bulletGroup directly; use getArray() where needed for iteration
            const weapon = new WeaponComponent(dto);
            entity.addComponent(weapon);
        }

        // Health component
        const health = new HealthComponent(maxHealth);
        entity.addComponent(health);

        // Collider component
        const collider = new ColliderComponent(maxVelocity / 2, CollisionLayer.PLAYER);
        entity.addComponent(collider);

        // Upgrades component
        const upgrades = new UpgradesComponent();
        entity.addComponent(upgrades);

        // Score component (all players start with 0)
        const score = new ScoreComponent();
        entity.addComponent(score);

        return entity;
    }

    /**
     * Converts a Player ECS Entity to a PlayerDTO.
     * @param entity - The player entity instance
     * @returns PlayerDTO
     */
    public static toDTO(entity: Entity): PlayerDTO {
        const player = entity.getComponent(PlayerComponent);
        const transform = entity.getComponent(TransformComponent);
        const health = entity.getComponent(HealthComponent);

        if (!player || !health || !transform) {
            throw new Error('Entity missing PlayerComponent or TransformComponent');
        }
        const spriteKey = transform.sprite.texture.key; // spriteKey is not on PlayerComponent, so we must infer it from the sprite texture key
        const { id, name, isLocal, level } = player;
        const { x, y, rotation } = transform;
        const { currentHealth, maxHealth } = health;
        return new PlayerDTO({ id, name, x, y, spriteKey, isLocal, level, health: currentHealth, maxHealth, angle: rotation });
    }
}
