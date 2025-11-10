import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameConfig } from '@shared/config';
import type { Level } from '@shared/models';
import { createPlayerEntity, syncPlayerToLegacy, EntityManager } from '@/ecs/core';
import { Player } from '@/entities/Player';
import { TransformComponent, MovementComponent, WeaponComponent, PlayerComponent, HealthComponent, ColliderComponent, UpgradesComponent, LegacyPlayerComponent } from '@/ecs/components';
import { CollisionLayer } from '@/ecs/types';

// Mock Phaser Scene and objects
const createMockScene = () => ({
    add: {
        sprite: vi.fn().mockReturnValue({
            setOrigin: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
        }),
        group: vi.fn().mockReturnValue({
            createMultiple: vi.fn(),
            children: { entries: [] },
        }),
    },
    physics: {
        add: {
            sprite: vi.fn().mockReturnValue({
                setOrigin: vi.fn().mockReturnThis(),
                setDepth: vi.fn().mockReturnThis(),
                setCollideWorldBounds: vi.fn().mockReturnThis(),
                setDrag: vi.fn().mockReturnThis(),
                setMaxVelocity: vi.fn().mockReturnThis(),
            }),
            group: vi.fn().mockReturnValue({
                createMultiple: vi.fn(),
                children: { entries: [] },
            }),
        },
    },
    time: {},
    input: {},
}) as unknown as Phaser.Scene;

const createMockSprite = () => ({
    x: 100,
    y: 200,
    rotation: 0,
    setVelocity: vi.fn(),
    setAcceleration: vi.fn(),
    body: {
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 },
    },
}) as unknown as Phaser.Physics.Arcade.Sprite;

const createMockBulletGroup = () => ({
        getFirstDead: vi.fn(),
    children: { entries: [] },
}) as unknown as Phaser.Physics.Arcade.Group;

const createMockPlayer = (overrides?: Partial<Player>) => {
    const sprite = createMockSprite();
    const bullets = createMockBulletGroup();

    return {
        id: 'player-123',
        name: 'TestPlayer',
        sprite,
        bullets,
        ammo: 100,
        level: 1,
        ...overrides,
    } as unknown as Player;
};

describe('factories', () => {
    let entityManager: EntityManager;
    let mockScene: Phaser.Scene;

    beforeEach(() => {
        mockScene = createMockScene();
        entityManager = new EntityManager(mockScene);
    });

    describe('createPlayerEntity', () => {
        it('should create an entity with all required components', () => {
            const player = createMockPlayer();
            const entity = createPlayerEntity(entityManager, player, true);

            expect(entity.hasComponent(TransformComponent)).toBe(true);
            expect(entity.hasComponent(MovementComponent)).toBe(true);
            expect(entity.hasComponent(WeaponComponent)).toBe(true);
            expect(entity.hasComponent(PlayerComponent)).toBe(true);
            expect(entity.hasComponent(HealthComponent)).toBe(true);
            expect(entity.hasComponent(ColliderComponent)).toBe(true);
            expect(entity.hasComponent(UpgradesComponent)).toBe(true);
            expect(entity.hasComponent(LegacyPlayerComponent)).toBe(true);
        });

        it('should link TransformComponent to player sprite', () => {
            const player = createMockPlayer();
            const entity = createPlayerEntity(entityManager, player, true);

            const transform = entity.getComponent(TransformComponent);
            expect(transform).toBeDefined();
            expect(transform!.sprite).toBe(player.sprite);
        });

        it('should initialize MovementComponent with correct values', () => {
            const player = createMockPlayer();
            const entity = createPlayerEntity(entityManager, player, true);

            const movement = entity.getComponent(MovementComponent);
            expect(movement).toBeDefined();
            expect(movement!.maxVelocity).toBe(GameConfig.player.maxVelocity);
            expect(movement!.acceleration).toBe(GameConfig.player.acceleration);
            expect(movement!.drag).toBe(0.97);
            expect(movement!.rotationSpeed).toBe(0.03);
        });

        it('should sync initial rotation from player sprite', () => {
            const player = createMockPlayer();
            player.sprite.rotation = 1.5;

            const entity = createPlayerEntity(entityManager, player, true);

            const movement = entity.getComponent(MovementComponent);
            expect(movement!.targetRotation).toBe(1.5);
        });

        it('should initialize WeaponComponent with player bullets and config', () => {
            const player = createMockPlayer({ ammo: 50, level: 2 as Level });
            const entity = createPlayerEntity(entityManager, player, true);

            const weapon = entity.getComponent(WeaponComponent);
            expect(weapon).toBeDefined();
            expect(weapon!.bullets).toBe(player.bullets);
            expect(weapon!.ammo).toBe(50);
            expect(weapon!.maxAmmo).toBe(999);
            expect(weapon!.fireRate).toBe(GameConfig.player.fireRate);
            expect(weapon!.bulletSpeed).toBe(400);
            expect(weapon!.damage).toBe(1);
            expect(weapon!.bulletSpriteKey).toBe('laser-level-2');
        });

        it('should not add WeaponComponent if player has no bullets', () => {
            const player = createMockPlayer({ bullets: undefined });
            const entity = createPlayerEntity(entityManager, player, true);

            const weapon = entity.getComponent(WeaponComponent);
            expect(weapon).toBeUndefined();
        });

        it('should initialize PlayerComponent with correct metadata', () => {
            const player = createMockPlayer({
                id: 'custom-id',
                name: 'CustomName',
                level: 3,
            });
            const entity = createPlayerEntity(entityManager, player, false);

            const playerComp = entity.getComponent(PlayerComponent);
            expect(playerComp).toBeDefined();
            expect(playerComp!.playerId).toBe('custom-id');
            expect(playerComp!.playerName).toBe('CustomName');
            expect(playerComp!.isLocal).toBe(false);
            expect(playerComp!.level).toBe(3);
        });

        it('should initialize local player correctly', () => {
            const player = createMockPlayer();
            const entity = createPlayerEntity(entityManager, player, true);

            const playerComp = entity.getComponent(PlayerComponent);
            expect(playerComp!.isLocal).toBe(true);
        });

        it('should initialize HealthComponent with max health', () => {
            const player = createMockPlayer();
            const entity = createPlayerEntity(entityManager, player, true);

            const health = entity.getComponent(HealthComponent);
            expect(health).toBeDefined();
            expect(health!.currentHealth).toBe(100);
            expect(health!.maxHealth).toBe(100);
        });

        it('should initialize ColliderComponent with correct layer', () => {
            const player = createMockPlayer();
            const entity = createPlayerEntity(entityManager, player, true);

            const collider = entity.getComponent(ColliderComponent);
            expect(collider).toBeDefined();
            expect(collider!.layer).toBe(CollisionLayer.PLAYER);
            expect(collider!.radius).toBe(GameConfig.player.maxVelocity / 2);
        });

        it('should initialize UpgradesComponent', () => {
            const player = createMockPlayer();
            const entity = createPlayerEntity(entityManager, player, true);

            const upgrades = entity.getComponent(UpgradesComponent);
            expect(upgrades).toBeDefined();
        });

        it('should store reference to legacy player', () => {
            const player = createMockPlayer();
            const entity = createPlayerEntity(entityManager, player, true);

            const legacy = entity.getComponent(LegacyPlayerComponent);
            expect(legacy).toBeDefined();
            expect(legacy!.player).toBe(player);
        });

        it('should register entity with EntityManager', () => {
            const player = createMockPlayer();
            const entity = createPlayerEntity(entityManager, player, true);

            const allEntities = entityManager.getAllEntities();
            expect(allEntities).toContain(entity);
        });

        it('should use correct bullet sprite based on player level', () => {
            const testCases = [
                { level: 1 as Level, expected: 'laser-level-1' },
                { level: 2 as Level, expected: 'laser-level-2' },
                { level: 5 as Level, expected: 'laser-level-5' },
            ];

            testCases.forEach(({ level, expected }) => {
                const manager = new EntityManager(mockScene);
                const player = createMockPlayer({ level });
                const entity = createPlayerEntity(manager, player, true);

                const weapon = entity.getComponent(WeaponComponent);
                expect(weapon!.bulletSpriteKey).toBe(expected);
            });
        });
    });

    describe('syncPlayerToLegacy', () => {
        it('should sync weapon ammo from component to legacy player', () => {
            const player = createMockPlayer({ ammo: 100 });
            const entity = createPlayerEntity(entityManager, player, true);

            const weapon = entity.getComponent(WeaponComponent);
            weapon!.ammo = 50;

            syncPlayerToLegacy(entity);

            expect(player.ammo).toBe(50);
        });

        it('should sync sprite rotation from component to legacy player', () => {
            const player = createMockPlayer();
            player.sprite.rotation = 0;

            const entity = createPlayerEntity(entityManager, player, true);

            const transform = entity.getComponent(TransformComponent);
            transform!.sprite.rotation = 2.5;

            syncPlayerToLegacy(entity);

            expect(player.sprite.rotation).toBe(2.5);
        });

        it('should handle entity without LegacyPlayerComponent gracefully', () => {
            const player = createMockPlayer();
            const entity = createPlayerEntity(entityManager, player, true);

            entity.removeComponent(LegacyPlayerComponent);

            expect(() => syncPlayerToLegacy(entity)).not.toThrow();
        });

        it('should handle entity without WeaponComponent gracefully', () => {
            const player = createMockPlayer({ bullets: undefined });
            const entity = createPlayerEntity(entityManager, player, true);

            player.ammo = 100;

            expect(() => syncPlayerToLegacy(entity)).not.toThrow();
            expect(player.ammo).toBe(100); // Should remain unchanged
        });

        it('should handle entity without MovementComponent gracefully', () => {
            const player = createMockPlayer();
            const entity = createPlayerEntity(entityManager, player, true);

            entity.removeComponent(MovementComponent);

            expect(() => syncPlayerToLegacy(entity)).not.toThrow();
        });

        it('should handle entity without TransformComponent gracefully', () => {
            const player = createMockPlayer();
            const entity = createPlayerEntity(entityManager, player, true);

            entity.removeComponent(TransformComponent);

            expect(() => syncPlayerToLegacy(entity)).not.toThrow();
        });

        it('should sync all values in one call', () => {
            const player = createMockPlayer({ ammo: 100 });
            player.sprite.rotation = 0;

            const entity = createPlayerEntity(entityManager, player, true);

            const weapon = entity.getComponent(WeaponComponent);
            const transform = entity.getComponent(TransformComponent);

            weapon!.ammo = 25;
            transform!.sprite.rotation = 3.14;

            syncPlayerToLegacy(entity);

            expect(player.ammo).toBe(25);
            expect(player.sprite.rotation).toBe(3.14);
        });

        it('should allow multiple syncs without side effects', () => {
            const player = createMockPlayer({ ammo: 100 });
            const entity = createPlayerEntity(entityManager, player, true);

            const weapon = entity.getComponent(WeaponComponent);

            weapon!.ammo = 75;
            syncPlayerToLegacy(entity);
            expect(player.ammo).toBe(75);

            weapon!.ammo = 50;
            syncPlayerToLegacy(entity);
            expect(player.ammo).toBe(50);

            weapon!.ammo = 25;
            syncPlayerToLegacy(entity);
            expect(player.ammo).toBe(25);
        });
    });

    describe('integration', () => {
        it('should create entity and sync changes back to legacy player', () => {
            const player = createMockPlayer({ ammo: 100 });
            const entity = createPlayerEntity(entityManager, player, true);

            // Simulate ECS system modifying components
            const weapon = entity.getComponent(WeaponComponent);
            weapon!.ammo -= 10; // Fire 10 bullets

            // Sync back to legacy
            syncPlayerToLegacy(entity);

            expect(player.ammo).toBe(90);
        });

        it('should maintain component relationships through sync', () => {
            const player = createMockPlayer();
            const entity = createPlayerEntity(entityManager, player, true);

            const transform = entity.getComponent(TransformComponent);
            const movement = entity.getComponent(MovementComponent);

            // Update rotation
            transform!.sprite.rotation = 1.57;

            syncPlayerToLegacy(entity);

            // Verify relationships are maintained
            expect(player.sprite.rotation).toBe(1.57);
            expect(movement!.targetRotation).toBeDefined();
        });
    });
});