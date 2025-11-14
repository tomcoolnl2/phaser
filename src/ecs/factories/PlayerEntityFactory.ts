import Phaser from 'phaser';
import { GameConfig } from '@shared/config';
import { CollisionLayer } from '@shared/types';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { PlayerSchema } from '@shared/dto/Player.schema';
import { WeaponDTO } from '@shared/dto/Weapon.dto';
import { EntityManager } from '@/ecs/core/EntityManager';
import { Entity } from '@/ecs/core/Entity';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { MovementComponent } from '@/ecs/components/MovementComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { HealthComponent } from '@/ecs/components/HealthComponent';
import { ColliderComponent } from '@/ecs/components/ColliderComponent';
import { UpgradesComponent } from '@/ecs/components/UpgradesComponent';

/**
 * PlayerEntityFactory - OOP ECS factory for player entities.
 *
 * Usage:
 *   const factory = new PlayerEntityFactory(scene, entityManager);
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
    constructor(
        private scene: Phaser.Scene,
        private entityManager: EntityManager
    ) {}

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

        const result = PlayerSchema.safeParse(playerDTO);
        if (!result.success) {
            throw new Error('Invalid PlayerDTO: ' + result.error.message);
        }

        // Create the entity
        const entity = this.entityManager.createEntity();

        // Create player sprite
        const sprite = this.scene.physics.add.sprite(playerDTO.x, playerDTO.y, playerDTO.spriteKey).setOrigin(0.5, 0.5);

        // Setup physics
        sprite.setCollideWorldBounds(true);
        sprite.setBounce(0);
        sprite.setDamping(true);
        sprite.setDrag(0.99);
        sprite.setMaxVelocity(GameConfig.player.maxVelocity); 
        sprite.setAngularDrag(GameConfig.player.angularDrag);
        sprite.setData('id', playerDTO.id);

        // Transform component - owns the sprite
        const transform = new TransformComponent(sprite);
        entity.addComponent(transform);

        // Movement component
        const movement = new MovementComponent(
            GameConfig.player.maxVelocity,
            GameConfig.player.acceleration,
            0.97, // drag value
            2.0 // rotation speed
        );
        movement.targetRotation = sprite.rotation;
        entity.addComponent(movement);

        // Player component
        const player = new PlayerComponent(playerDTO.id, playerDTO.name, playerDTO.isLocal, playerDTO.level);
        entity.addComponent(player);

        // Weapon component - only for local players
        if (playerDTO.isLocal) {
            const bulletGroup = this.scene.physics.add.group({
                classType: Phaser.Physics.Arcade.Sprite,
                maxSize: 10,
            }) as Phaser.Physics.Arcade.Group;

            const dto = new WeaponDTO(playerDTO.id + '-weapon');
            // Pass the bulletGroup directly; use getArray() where needed for iteration
            const weapon = new WeaponComponent(
                bulletGroup,
                dto,
                `laser-level-${playerDTO.level}`
            );
            entity.addComponent(weapon);
        }

        // Health component
        const health = new HealthComponent(100);
        entity.addComponent(health);

        // Collider component
        const collider = new ColliderComponent(GameConfig.player.maxVelocity / 2, CollisionLayer.PLAYER);
        entity.addComponent(collider);

        // Upgrades component
        const upgrades = new UpgradesComponent();
        entity.addComponent(upgrades);

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
        if (!player || !transform) {
            throw new Error('Entity missing PlayerComponent or TransformComponent');
        }
        // spriteKey is not on PlayerComponent, so we must infer it from the sprite texture key
        const spriteKey = transform.sprite.texture.key;
        return new PlayerDTO(
            player.playerId,
            player.playerName,
            transform.x,
            transform.y,
            spriteKey,
            player.isLocal,
            player.level
        );
    }
}
