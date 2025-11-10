import { Entity } from './Entity';
import { EntityManager } from './EntityManager';
import { Player } from '../entities/Player';
import { TransformComponent } from './components/TransformComponent';
import { MovementComponent } from './components/MovementComponent';
import { WeaponComponent } from './components/WeaponComponent';
import { PlayerComponent } from './components/PlayerComponent';
import { HealthComponent } from './components/HealthComponent';
import { ColliderComponent } from './components/ColliderComponent';
import { UpgradesComponent } from './components/UpgradesComponent';
import { LegacyPlayerComponent } from './components/LegacyPlayerComponent';
import { GameConfig } from '../../shared/config';
import { ComponentClass, Component } from './Component';

/**
 * Factory functions to create ECS entities from existing game objects
 */

/**
 * Creates an ECS entity from an existing Player instance
 * This allows gradual migration to ECS - the Player sprite and logic stay the same,
 * but we can add ECS components for upgrades, health, etc.
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
            1 // base damage
        );
        entity.addComponent(weapon);
    }

    // Player component
    const playerComp = new PlayerComponent(player.id, player.name, isLocal);
    entity.addComponent(playerComp);

    // Health component - starting with max health
    const health = new HealthComponent(100);
    entity.addComponent(health);

    // Collider component - for collision detection
    const collider = new ColliderComponent(GameConfig.player.maxVelocity / 2, 'player');
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
 * Syncs ECS component state back to the legacy Player instance
 * Call this during the migration period to keep both systems in sync
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
