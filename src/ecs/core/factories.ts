import { GameConfig } from '../../../shared/config';
import { Entity } from './Entity';
import { EntityManager } from './EntityManager';
import { Player } from '../../entities/Player';
import { TransformComponent } from '../components/TransformComponent';
import { MovementComponent } from '../components/MovementComponent';
import { WeaponComponent } from '../components/WeaponComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { HealthComponent } from '../components/HealthComponent';
import { ColliderComponent } from '../components/ColliderComponent';
import { UpgradesComponent } from '../components/UpgradesComponent';
import { LegacyPlayerComponent } from '../components/LegacyPlayerComponent';
import { CollisionLayer } from '../types';

/**
 * @fileoverview Factory functions for creating ECS entities from game objects.
 *
 * These factories enable gradual migration from OOP to ECS by wrapping existing
 * game objects (like Player) in ECS entities. This allows new ECS systems to
 * operate alongside legacy code during the transition period.
 */

/**
 * Creates an ECS entity from an existing Player instance.
 *
 * This factory wraps a legacy Player object in ECS components, allowing it to
 * work with ECS systems while maintaining backwards compatibility. The entity
 * includes all necessary components for a fully-functional player:
 * - TransformComponent: Links to Player sprite
 * - MovementComponent: Physics and controls
 * - WeaponComponent: Shooting and ammo
 * - PlayerComponent: Player metadata and level
 * - HealthComponent: HP tracking
 * - ColliderComponent: Collision detection
 * - UpgradesComponent: Stat progression
 * - LegacyPlayerComponent: Bridge to old Player class
 *
 * @param entityManager - The entity manager to register the entity with
 * @param player - The legacy Player instance to wrap
 * @param isLocal - True if this is the local player (controlled by this client)
 * @returns The newly created entity with all player components attached
 *
 * @example
 * ```typescript
 * const playerEntity = createPlayerEntity(entityManager, player, true);
 * // Player now works with ECS systems while maintaining legacy behavior
 * ```
 */
export function createPlayerEntity(entityManager: EntityManager, player: Player, isLocal: boolean): Entity {
    const entity = entityManager.createEntity();

    // Transform component - links to existing Player sprite
    const transform = new TransformComponent(player.sprite);
    entity.addComponent(transform);

    // Movement component - uses existing config values
    const movement = new MovementComponent(
        GameConfig.player.maxVelocity,
        GameConfig.player.acceleration,
        0.97, // drag value from Player class
        0.03 // rotation speed from Player class
    );
    // Sync initial rotation
    movement.targetRotation = player.sprite.rotation;
    entity.addComponent(movement);

    // Weapon component - links to existing bullet group
    if (player.bullets) {
        const weapon = new WeaponComponent(
            player.bullets,
            player.ammo,
            999,
            GameConfig.player.fireRate,
            400, // bullet speed
            1, // base damage
            `laser-level-${player.level}` // initial bullet sprite based on player level
        );
        entity.addComponent(weapon);
    }

    // Player component
    const playerComp = new PlayerComponent(player.id, player.name, isLocal, player.level);
    entity.addComponent(playerComp);

    // Health component - starting with max health
    const health = new HealthComponent(100);
    entity.addComponent(health);

    // Collider component - for collision detection
    const collider = new ColliderComponent(GameConfig.player.maxVelocity / 2, CollisionLayer.PLAYER);
    entity.addComponent(collider);

    // Upgrades component - tracks applied upgrades
    const upgrades = new UpgradesComponent();
    entity.addComponent(upgrades);

    // Legacy player component - maintains reference for migration period
    const legacy = new LegacyPlayerComponent(player);
    entity.addComponent(legacy);

    return entity;
}

/**
 * Syncs ECS component state back to the legacy Player instance.
 *
 * During the migration period, this function keeps the legacy Player object
 * in sync with changes made by ECS systems. This ensures backwards compatibility
 * with any legacy code that still reads Player properties directly.
 *
 * Currently syncs:
 * - Weapon ammo (ECS → Player.ammo)
 * - Sprite rotation (ECS → Player.sprite.rotation)
 *
 * @param entity - The entity containing both ECS components and LegacyPlayerComponent
 *
 * @example
 * ```typescript
 * // After ECS systems update, sync back to legacy
 * syncPlayerToLegacy(playerEntity);
 * // Now Player.ammo matches WeaponComponent.ammo
 * ```
 *
 * @deprecated This function is temporary and will be removed after full ECS migration
 */
export function syncPlayerToLegacy(entity: Entity): void {
    const legacy = entity.getComponent(LegacyPlayerComponent);
    const weapon = entity.getComponent(WeaponComponent);
    const movement = entity.getComponent(MovementComponent);
    const transform = entity.getComponent(TransformComponent);

    if (!legacy) return;

    const player = legacy.player;

    // Sync ammo
    if (weapon) {
        player.ammo = weapon.ammo;
    }

    // Sync rotation target
    if (movement && transform) {
        player.sprite.rotation = transform.sprite.rotation;
    }
}
