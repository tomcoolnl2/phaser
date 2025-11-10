import Phaser from 'phaser';
import { GameConfig } from '@shared/config';
import type { SpaceShip } from '@shared/models';
import { CollisionLayer } from '@/ecs/types';
import { Entity, EntityManager } from '@/ecs/core';
import { 
    TransformComponent,
    MovementComponent,
    WeaponComponent,
    PlayerComponent,
    HealthComponent,
    ColliderComponent,
    UpgradesComponent,
    UIComponent,
    AsteroidComponent,
    PickupComponent
} from '@/ecs/components';

/**
 * @fileoverview Factory functions for creating pure ECS entities.
 *
 * These factories create fully functional ECS entities without dependencies on
 * legacy OOP classes. All game logic is handled by ECS components and systems.
 */

/**
 * Creates a pure ECS player entity without legacy OOP dependencies.
 *
 * This is the new recommended way to create player entities. It creates a fully
 * functional player using only ECS components and systems, with no dependency on
 * the legacy Player class.
 *
 * The entity includes:
 * - TransformComponent: Manages the player sprite
 * - MovementComponent: Physics and controls
 * - WeaponComponent: Shooting and ammo (local players only)
 * - PlayerComponent: Player metadata and level
 * - HealthComponent: HP tracking
 * - ColliderComponent: Collision detection
 * - UpgradesComponent: Stat progression
 * - UIComponent: Name, level, and ammo displays
 *
 * @param scene - The Phaser scene to create objects in
 * @param entityManager - The entity manager to register the entity with
 * @param playerData - Player initialization data (id, name, position, level)
 * @param spriteKey - Texture key for the player sprite
 * @param isLocal - True if this is the local player (controlled by this client)
 * @returns The newly created pure ECS entity
 *
 * @example
 * ```typescript
 * const playerEntity = createPurePlayerEntity(
 *     scene,
 *     entityManager,
 *     { id: 'p1', name: 'Alice', x: 100, y: 100, level: 1 },
 *     'shooter-sprite',
 *     true
 * );
 * ```
 */
export function createPurePlayerEntity(
    scene: Phaser.Scene,
    entityManager: EntityManager,
    playerData: SpaceShip,
    spriteKey: string,
    isLocal: boolean
): Entity {
    const entity = entityManager.createEntity();

    // Create player sprite
    const sprite = scene.physics.add.sprite(playerData.x, playerData.y, spriteKey).setOrigin(0.5, 0.5);

    // Setup physics
    sprite.setCollideWorldBounds(true);
    sprite.setBounce(0);
    sprite.setDamping(true);
    sprite.setDrag(0.99);
    sprite.setMaxVelocity(GameConfig.player.maxVelocity);
    sprite.setAngularDrag(GameConfig.player.angularDrag);
    sprite.setData('id', playerData.id);

    // Transform component - owns the sprite
    const transform = new TransformComponent(sprite);
    entity.addComponent(transform);

    // Movement component
    const movement = new MovementComponent(
        GameConfig.player.maxVelocity,
        GameConfig.player.acceleration,
        0.97, // drag value
        0.03  // rotation speed
    );
    movement.targetRotation = sprite.rotation;
    entity.addComponent(movement);

    // Weapon component - only for local players
    if (isLocal) {
        const bulletGroup = scene.physics.add.group({
            maxSize: 10,
        });

        const weapon = new WeaponComponent(
            bulletGroup,
            playerData.ammo || 0,
            999,
            GameConfig.player.fireRate,
            400, // bullet speed
            1,   // base damage
            `laser-level-${playerData.level || 1}` // bullet sprite
        );
        entity.addComponent(weapon);
    }

    // Player component
    const playerComp = new PlayerComponent(
        playerData.id,
        playerData.name,
        isLocal,
        playerData.level || 1
    );
    entity.addComponent(playerComp);

    // Health component
    const health = new HealthComponent(100);
    entity.addComponent(health);

    // Collider component
    const collider = new ColliderComponent(
        GameConfig.player.maxVelocity / 2,
        CollisionLayer.PLAYER
    );
    entity.addComponent(collider);

    // Upgrades component
    const upgrades = new UpgradesComponent();
    entity.addComponent(upgrades);

    // UI component - manages name, level, and ammo displays
    const ui = new UIComponent(
        scene,
        playerData.name,
        playerData.level || 1,
        isLocal,
        playerData.x,
        playerData.y
    );
    entity.addComponent(ui);

    return entity;
}

/**
 * Creates a pure ECS asteroid entity.
 *
 * Creates a destructible asteroid entity with health tracking and visual feedback.
 * Asteroids spin continuously, take damage when hit by bullets, and explode when destroyed.
 *
 * The entity includes:
 * - TransformComponent: Manages the asteroid sprite
 * - HealthComponent: Tracks HP (default 3)
 * - ColliderComponent: Collision detection
 * - AsteroidComponent: Asteroid-specific data
 *
 * @param scene - The Phaser scene to create objects in
 * @param entityManager - The entity manager to register the entity with
 * @param asteroidId - Unique identifier for this asteroid
 * @param x - Initial X position
 * @param y - Initial Y position
 * @returns The newly created asteroid entity
 *
 * @example
 * ```typescript
 * const asteroid = createAsteroidEntity(
 *     scene,
 *     entityManager,
 *     'asteroid-123',
 *     400,
 *     100
 * );
 * ```
 */
export function createAsteroidEntity(
    scene: Phaser.Scene,
    entityManager: EntityManager,
    asteroidId: string,
    x: number,
    y: number
): Entity {
    const entity = entityManager.createEntity();

    // Create asteroid sprite
    const sprite = scene.physics.add.sprite(x, y, 'asteroid').setOrigin(0.5, 0.5);

    // Setup physics
    sprite.setCollideWorldBounds(false);
    sprite.setImmovable(true);
    sprite.setMaxVelocity(GameConfig.asteroid.maxVelocity);
    sprite.setData('id', asteroidId);

    // Play animation
    sprite.play('asteroid-spin');

    // Transform component - owns the sprite
    const transform = new TransformComponent(sprite);
    entity.addComponent(transform);

    // Health component
    const health = new HealthComponent(GameConfig.asteroid.health);
    entity.addComponent(health);

    // Collider component
    const collider = new ColliderComponent(
        GameConfig.asteroid.collisionRadius,
        CollisionLayer.ASTEROID
    );
    entity.addComponent(collider);

    // Asteroid component
    const asteroid = new AsteroidComponent(asteroidId);
    entity.addComponent(asteroid);

    return entity;
}

/**
 * Creates a pure ECS pickup entity.
 *
 * Creates a collectible pickup item with animations and particle effects.
 * Pickups float, rotate, and emit particles to attract player attention.
 *
 * The entity includes:
 * - TransformComponent: Manages the pickup sprite
 * - PickupComponent: Type and value data
 *
 * @param scene - The Phaser scene to create objects in
 * @param entityManager - The entity manager to register the entity with
 * @param x - Initial X position
 * @param y - Initial Y position
 * @param type - Type of pickup ('ammo', 'health', etc.)
 * @param value - Amount to grant when collected
 * @returns The newly created pickup entity
 *
 * @example
 * ```typescript
 * const pickup = createPickupEntity(
 *     scene,
 *     entityManager,
 *     400,
 *     300,
 *     'ammo',
 *     10
 * );
 * ```
 */
export function createPickupEntity(
    scene: Phaser.Scene,
    entityManager: EntityManager,
    x: number,
    y: number,
    type: string = 'ammo',
    value: number = 10
): Entity {
    const entity = entityManager.createEntity();

    // Create pickup sprite
    const sprite = scene.physics.add.sprite(x, y, 'pickup').setOrigin(0.5, 0.5);

    // Transform component - owns the sprite
    const transform = new TransformComponent(sprite);
    entity.addComponent(transform);

    // Pickup component
    const pickup = new PickupComponent(type, value);
    entity.addComponent(pickup);

    return entity;
}
