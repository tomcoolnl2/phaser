import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerSystem } from '@/ecs/systems/PlayerSystem';
import { Entity } from '@/ecs/core/Entity';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { PickupComponent } from '@/ecs/components/PickupComponent';
import { ScoreComponent } from '@/ecs/components/ScoreComponent';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { MockArcadeSprite, MockArcadeGroup } from './__mocks__/phaser';
import { MockWeaponDTO } from './__mocks__/WeaponDTO';
import { HealthComponent } from '@/ecs/components/HealthComponent';
import { PickupType } from '@shared/dto/Pickup.dto';
import { WeaponDTO } from '@shared/dto/Weapon.dto';

// Minimal mock for GameScene
class MockScene {
    emitPlayerPickup = vi.fn();
    destroyPickupEntity = vi.fn();
    handleSocketError = vi.fn();
    entityManager = { queryEntities: vi.fn() };
    add = { sprite: vi.fn(() => ({ anims: { play: vi.fn(), once: vi.fn() }, destroy: vi.fn(), x: 0, y: 0 })) };
}

describe('PlayerSystem', () => {
    let system: PlayerSystem;
    let scene: MockScene;
    let player: Entity;
    let pickup: Entity;

    beforeEach(() => {
        scene = new MockScene();
        system = new PlayerSystem(scene as unknown as any);
        player = new Entity();
        pickup = new Entity();
        player.addComponent(new PlayerComponent('pid', 'pname', true));
        player.addComponent(new ScoreComponent());
        // Mock dependencies for WeaponComponent
        const mockBullets = new MockArcadeGroup() as unknown as Phaser.Physics.Arcade.Group;
        const mockWeaponDTO = new MockWeaponDTO();
        const mockBulletSpriteKey = 'test-bullet';

        player.addComponent(new WeaponComponent(mockBullets, mockWeaponDTO as unknown as WeaponDTO, mockBulletSpriteKey));
        player.addComponent(new HealthComponent(1));
        player.addComponent(new TransformComponent(new MockArcadeSprite() as unknown as Phaser.Physics.Arcade.Sprite));
        pickup.addComponent(new PickupComponent(PickupType.COIN, 50));
        pickup.addComponent(new TransformComponent(new MockArcadeSprite() as unknown as Phaser.Physics.Arcade.Sprite));
    });

    it('handleCoinPickup adds score and emits event', () => {
        const score = player.getComponent(ScoreComponent)!;
        system.handleCoinPickup(player, pickup, scene as unknown as any);
        expect(score.score).toBe(50);
        expect(scene.emitPlayerPickup).toHaveBeenCalled();
        expect(scene.destroyPickupEntity).toHaveBeenCalled();
    });

    it('handleAmmoPickup adds ammo and emits event', () => {
        const weapon = player.getComponent(WeaponComponent)!;
        pickup.getComponent(PickupComponent)!.type = PickupType.AMMO;
        pickup.getComponent(PickupComponent)!.value = 1;
        system.handleAmmoPickup(player, pickup, scene as unknown as any);
        expect(scene.emitPlayerPickup).toHaveBeenCalled();
        expect(scene.destroyPickupEntity).toHaveBeenCalled();
    });

    it('handleHealthPickup heals and emits event', () => {
        const health = player.getComponent(HealthComponent)!;
        pickup.getComponent(PickupComponent)!.type = PickupType.HEALTH;
        pickup.getComponent(PickupComponent)!.value = 1;
        health.currentHealth = 0;
        system.handleHealthPickup(player, pickup, scene as unknown as any);
        expect(health.currentHealth).toBe(1);
        expect(scene.emitPlayerPickup).toHaveBeenCalled();
        expect(scene.destroyPickupEntity).toHaveBeenCalled();
    });
});
