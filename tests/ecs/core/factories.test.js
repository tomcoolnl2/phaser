import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameConfig } from '@shared/config';
import { createPurePlayerEntity, EntityManager } from '@/ecs/core';
import { TransformComponent, MovementComponent, WeaponComponent, PlayerComponent, HealthComponent, ColliderComponent, UpgradesComponent, UIComponent, } from '@/ecs/components';
import { CollisionLayer } from '@/ecs/types';
// Mock Phaser Scene
const createMockScene = () => {
    const mockSprite = {
        x: 0,
        y: 0,
        rotation: 0,
        setOrigin: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setPosition: vi.fn().mockReturnThis(),
        setRotation: vi.fn().mockReturnThis(),
        setCollideWorldBounds: vi.fn().mockReturnThis(),
        setBounce: vi.fn().mockReturnThis(),
        setDamping: vi.fn().mockReturnThis(),
        setDrag: vi.fn().mockReturnThis(),
        setMaxVelocity: vi.fn().mockReturnThis(),
        setAngularDrag: vi.fn().mockReturnThis(),
        setData: vi.fn().mockReturnThis(),
        body: {
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
        },
    };
    const mockGroup = {
        maxSize: 10,
        createMultiple: vi.fn(),
        children: { entries: [] },
    };
    const mockText = {
        x: 0,
        y: 0,
        text: '',
        setOrigin: vi.fn().mockReturnThis(),
        setPosition: vi.fn().mockReturnThis(),
        setText: vi.fn().mockReturnThis(),
        setColor: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
    };
    return {
        add: {
            sprite: vi.fn().mockReturnValue(mockSprite),
            text: vi.fn().mockReturnValue(mockText),
        },
        physics: {
            add: {
                sprite: vi.fn().mockReturnValue(mockSprite),
                group: vi.fn().mockReturnValue(mockGroup),
            },
        },
        time: {},
        input: {},
    };
};
describe('Pure ECS Factories', () => {
    let entityManager;
    let mockScene;
    beforeEach(() => {
        mockScene = createMockScene();
        entityManager = new EntityManager(mockScene);
    });
    describe('createPurePlayerEntity', () => {
        const mockPlayerData = {
            id: 'player-123',
            name: 'TestPlayer',
            x: 100,
            y: 200,
            level: 1,
            ammo: 50,
        };
        it('should create an entity with all required components', () => {
            const entity = createPurePlayerEntity(mockScene, entityManager, mockPlayerData, 'sprite-key', true);
            expect(entity.hasComponent(TransformComponent)).toBe(true);
            expect(entity.hasComponent(MovementComponent)).toBe(true);
            expect(entity.hasComponent(WeaponComponent)).toBe(true);
            expect(entity.hasComponent(PlayerComponent)).toBe(true);
            expect(entity.hasComponent(HealthComponent)).toBe(true);
            expect(entity.hasComponent(ColliderComponent)).toBe(true);
            expect(entity.hasComponent(UpgradesComponent)).toBe(true);
            expect(entity.hasComponent(UIComponent)).toBe(true);
        });
        it('should initialize TransformComponent with sprite', () => {
            const entity = createPurePlayerEntity(mockScene, entityManager, mockPlayerData, 'sprite-key', true);
            const transform = entity.getComponent(TransformComponent);
            expect(transform).toBeDefined();
            expect(transform.sprite).toBeDefined();
        });
        it('should initialize MovementComponent with correct values', () => {
            const entity = createPurePlayerEntity(mockScene, entityManager, mockPlayerData, 'sprite-key', true);
            const movement = entity.getComponent(MovementComponent);
            expect(movement).toBeDefined();
            expect(movement.maxVelocity).toBe(GameConfig.player.maxVelocity);
            expect(movement.acceleration).toBe(GameConfig.player.acceleration);
            expect(movement.drag).toBe(0.97);
            expect(movement.rotationSpeed).toBe(0.03);
        });
        it('should initialize WeaponComponent for local player', () => {
            const entity = createPurePlayerEntity(mockScene, entityManager, mockPlayerData, 'sprite-key', true);
            const weapon = entity.getComponent(WeaponComponent);
            expect(weapon).toBeDefined();
            expect(weapon.ammo).toBe(50);
            expect(weapon.maxAmmo).toBe(999);
            expect(weapon.fireRate).toBe(GameConfig.player.fireRate);
            expect(weapon.bulletSpeed).toBe(400);
            expect(weapon.damage).toBe(1);
            expect(weapon.bulletSpriteKey).toBe('laser-level-1');
        });
        it('should not create WeaponComponent for remote player', () => {
            const entity = createPurePlayerEntity(mockScene, entityManager, mockPlayerData, 'sprite-key', false);
            const weapon = entity.getComponent(WeaponComponent);
            expect(weapon).toBeUndefined();
        });
        it('should initialize PlayerComponent with correct metadata', () => {
            const entity = createPurePlayerEntity(mockScene, entityManager, mockPlayerData, 'sprite-key', true);
            const playerComp = entity.getComponent(PlayerComponent);
            expect(playerComp).toBeDefined();
            expect(playerComp.playerId).toBe('player-123');
            expect(playerComp.playerName).toBe('TestPlayer');
            expect(playerComp.isLocal).toBe(true);
            expect(playerComp.level).toBe(1);
        });
        it('should initialize HealthComponent with max health', () => {
            const entity = createPurePlayerEntity(mockScene, entityManager, mockPlayerData, 'sprite-key', true);
            const health = entity.getComponent(HealthComponent);
            expect(health).toBeDefined();
            expect(health.currentHealth).toBe(100);
            expect(health.maxHealth).toBe(100);
        });
        it('should initialize ColliderComponent with correct layer', () => {
            const entity = createPurePlayerEntity(mockScene, entityManager, mockPlayerData, 'sprite-key', true);
            const collider = entity.getComponent(ColliderComponent);
            expect(collider).toBeDefined();
            expect(collider.layer).toBe(CollisionLayer.PLAYER);
            expect(collider.radius).toBe(GameConfig.player.maxVelocity / 2);
        });
        it('should initialize UIComponent with player info', () => {
            const entity = createPurePlayerEntity(mockScene, entityManager, mockPlayerData, 'sprite-key', true);
            const ui = entity.getComponent(UIComponent);
            expect(ui).toBeDefined();
            expect(ui.isLocal).toBe(true);
            expect(ui.nameText).toBeDefined();
            expect(ui.levelText).toBeDefined();
            expect(ui.ammoText).toBeDefined(); // Local player has ammo display
        });
        it('should not create ammo display for remote player', () => {
            const entity = createPurePlayerEntity(mockScene, entityManager, mockPlayerData, 'sprite-key', false);
            const ui = entity.getComponent(UIComponent);
            expect(ui).toBeDefined();
            expect(ui.isLocal).toBe(false);
            expect(ui.ammoText).toBeUndefined(); // Remote player has no ammo display
        });
        it('should initialize UpgradesComponent', () => {
            const entity = createPurePlayerEntity(mockScene, entityManager, mockPlayerData, 'sprite-key', true);
            const upgrades = entity.getComponent(UpgradesComponent);
            expect(upgrades).toBeDefined();
        });
        it('should register entity with EntityManager', () => {
            const entity = createPurePlayerEntity(mockScene, entityManager, mockPlayerData, 'sprite-key', true);
            const allEntities = entityManager.getAllEntities();
            expect(allEntities).toContain(entity);
        });
        it('should use correct bullet sprite based on player level', () => {
            const testCases = [
                { level: 1, expected: 'laser-level-1' },
                { level: 2, expected: 'laser-level-2' },
                { level: 5, expected: 'laser-level-5' },
            ];
            testCases.forEach(({ level, expected }) => {
                const manager = new EntityManager(mockScene);
                const data = { ...mockPlayerData, level };
                const entity = createPurePlayerEntity(mockScene, manager, data, 'sprite-key', true);
                const weapon = entity.getComponent(WeaponComponent);
                expect(weapon.bulletSpriteKey).toBe(expected);
            });
        });
        it('should handle player data without optional fields', () => {
            const minimalData = {
                id: 'minimal-player',
                name: 'Minimal',
                x: 0,
                y: 0,
                ammo: 0,
            };
            const entity = createPurePlayerEntity(mockScene, entityManager, minimalData, 'sprite-key', true);
            const playerComp = entity.getComponent(PlayerComponent);
            const weapon = entity.getComponent(WeaponComponent);
            expect(playerComp.level).toBe(1); // Default level
            expect(weapon.ammo).toBe(0); // Minimal ammo
        });
        it('should create sprite with correct physics properties', () => {
            const entity = createPurePlayerEntity(mockScene, entityManager, mockPlayerData, 'sprite-key', true);
            expect(mockScene.physics.add.sprite).toHaveBeenCalledWith(100, 200, 'sprite-key');
            const transform = entity.getComponent(TransformComponent);
            expect(transform.sprite.setCollideWorldBounds).toHaveBeenCalledWith(true);
            expect(transform.sprite.setMaxVelocity).toHaveBeenCalledWith(GameConfig.player.maxVelocity);
        });
    });
    describe('Integration tests', () => {
        it('should create multiple player entities without conflicts', () => {
            const player1Data = {
                id: 'player-1',
                name: 'Player 1',
                x: 100,
                y: 100,
                ammo: 0,
                level: 1,
            };
            const player2Data = {
                id: 'player-2',
                name: 'Player 2',
                x: 200,
                y: 200,
                ammo: 0,
                level: 2,
            };
            const entity1 = createPurePlayerEntity(mockScene, entityManager, player1Data, 'sprite-1', true);
            const entity2 = createPurePlayerEntity(mockScene, entityManager, player2Data, 'sprite-2', false);
            expect(entityManager.getEntityCount()).toBe(2);
            expect(entity1.getComponent(PlayerComponent).playerId).toBe('player-1');
            expect(entity2.getComponent(PlayerComponent).playerId).toBe('player-2');
        });
    });
});
//# sourceMappingURL=factories.test.js.map