import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WeaponUpgradeSystem } from '@/ecs/systems/WeaponUpgradeSystem';
import { Entity } from '@/ecs/core/Entity';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { WeaponDTO } from '@shared/dto/Weapon.dto';
import { ProjectileType } from '@shared/types';
import { GameScene } from '@/scenes/GameScene';

// Mock Phaser group for WeaponComponent
const mockGroup = {} as Phaser.Physics.Arcade.Group;

describe('WeaponUpgradeSystem', () => {
    let entity: Entity;
    let player: PlayerComponent;
    let weapon: WeaponComponent;
    let system: WeaponUpgradeSystem;

    // Mock GameScene for WeaponUpgradeSystem
    const mockScene = {} as GameScene;

    beforeEach(() => {
        entity = new Entity();
        player = new PlayerComponent('id', 'name', true, 1);
        const dto = new WeaponDTO('weapon-id', 1, ProjectileType.BULLET, 100);
        weapon = new WeaponComponent(mockGroup, dto, 'projectile-0');
        player.level = 1;
        weapon.bulletSpriteKey = 'projectile-0';
        entity.addComponent(player);
        entity.addComponent(weapon);
        system = new WeaponUpgradeSystem(mockScene);
    });

    it('sets bulletSpriteKey based on player level', () => {
        player.level = 2;
        system.update(entity, 0);
        expect(weapon.bulletSpriteKey).toBe('projectile-2');
    });

    it('does not update bulletSpriteKey if already correct', () => {
        player.level = 3;
        weapon.bulletSpriteKey = 'projectile-3';
        system.update(entity, 0);
        expect(weapon.bulletSpriteKey).toBe('projectile-3');
    });

    it('does nothing if missing components', () => {
        const entity = new Entity();
        // No components
        expect(() => system.update(entity, 0)).not.toThrow();
    });
});
