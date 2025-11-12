import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SpaceShip } from '@shared/model';
import { EntityManager } from '@/ecs/core/EntityManager';
import { createPlayerEntity } from '@/ecs/core/factories';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { MovementComponent } from '@/ecs/components/MovementComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { HealthComponent } from '@/ecs/components/HealthComponent';
import { ColliderComponent } from '@/ecs/components/ColliderComponent';
import { UpgradesComponent } from '@/ecs/components/UpgradesComponent';

describe('Player ECS Entity', () => {
    let mockScene: any;
    let entityManager: EntityManager;

    beforeEach(() => {
        // Mock Phaser scene
        mockScene = {
            physics: {
                add: {
                    sprite: vi.fn((x: number, y: number, texture: string) => {
                        const sprite: any = {
                            x,
                            y,
                            texture,
                            rotation: 0,
                            angle: 0,
                            alpha: 1,
                            active: true,
                            visible: true,
                            setOrigin: vi.fn().mockReturnThis(),
                            setCollideWorldBounds: vi.fn().mockReturnThis(),
                            setBounce: vi.fn().mockReturnThis(),
                            setDamping: vi.fn().mockReturnThis(),
                            setDrag: vi.fn().mockReturnThis(),
                            setMaxVelocity: vi.fn().mockReturnThis(),
                            setAngularDrag: vi.fn().mockReturnThis(),
                            setData: vi.fn().mockReturnThis(),
                            setPosition: vi.fn(function (this: any, newX: number, newY: number) {
                                this.x = newX;
                                this.y = newY;
                                return this;
                            }),
                            destroy: vi.fn(function (this: any) {
                                this.active = false;
                                this.visible = false;
                            }),
                        };
                        return sprite;
                    }),
                    group: vi.fn(() => ({
                        get: vi.fn(),
                        create: vi.fn(),
                        killAndHide: vi.fn(),
                        clear: vi.fn(),
                    })),
                },
            },
            add: {
                text: vi.fn((x: number, y: number, text: string, style: any) => ({
                    x,
                    y,
                    text,
                    style,
                    setOrigin: vi.fn().mockReturnThis(),
                    setDepth: vi.fn().mockReturnThis(),
                    setScrollFactor: vi.fn().mockReturnThis(),
                    setText: vi.fn(function (this: any, newText: string) {
                        this.text = newText;
                        return this;
                    }),
                    setPosition: vi.fn(function (this: any, newX: number, newY: number) {
                        this.x = newX;
                        this.y = newY;
                        return this;
                    }),
                    setVisible: vi.fn().mockReturnThis(),
                    destroy: vi.fn(),
                })),
            },
        };

        entityManager = new EntityManager(mockScene);
    });

    describe('createPlayerEntity', () => {
        const playerData: SpaceShip = {
            id: 'player-1',
            name: 'TestPlayer',
            x: 100,
            y: 200,
            level: 1,
            ammo: 50,
        };

        it('should create entity with all required components', () => {
            const entity = createPlayerEntity(mockScene, entityManager, playerData, 'shooter-sprite', true);

            expect(entity.hasComponent(TransformComponent)).toBe(true);
            expect(entity.hasComponent(MovementComponent)).toBe(true);
            expect(entity.hasComponent(PlayerComponent)).toBe(true);
            expect(entity.hasComponent(HealthComponent)).toBe(true);
            expect(entity.hasComponent(ColliderComponent)).toBe(true);
            expect(entity.hasComponent(UpgradesComponent)).toBe(true);
        });

        it('should create WeaponComponent for local player', () => {
            const entity = createPlayerEntity(mockScene, entityManager, playerData, 'shooter-sprite', true);

            expect(entity.hasComponent(WeaponComponent)).toBe(true);

            const weapon = entity.getComponent(WeaponComponent)!;
            expect(weapon.ammo).toBe(50);
        });

        it('should not create WeaponComponent for remote player', () => {
            const entity = createPlayerEntity(mockScene, entityManager, playerData, 'shooter-sprite', false);

            expect(entity.hasComponent(WeaponComponent)).toBe(false);
        });

        it('should initialize sprite at correct position', () => {
            const entity = createPlayerEntity(mockScene, entityManager, playerData, 'shooter-sprite', true);

            const transform = entity.getComponent(TransformComponent)!;
            expect(transform.sprite.x).toBe(100);
            expect(transform.sprite.y).toBe(200);
        });

        it('should configure sprite physics properties', () => {
            const entity = createPlayerEntity(mockScene, entityManager, playerData, 'shooter-sprite', true);

            const transform = entity.getComponent(TransformComponent)!;
            expect(transform.sprite.setCollideWorldBounds).toHaveBeenCalledWith(true);
            expect(transform.sprite.setBounce).toHaveBeenCalledWith(0);
            expect(transform.sprite.setDamping).toHaveBeenCalledWith(true);
            expect(transform.sprite.setDrag).toHaveBeenCalledWith(0.99);
        });

        it('should initialize PlayerComponent with correct data', () => {
            const entity = createPlayerEntity(mockScene, entityManager, playerData, 'shooter-sprite', true);

            const player = entity.getComponent(PlayerComponent)!;
            expect(player.playerId).toBe('player-1');
            expect(player.playerName).toBe('TestPlayer');
            expect(player.isLocal).toBe(true);
            expect(player.level).toBe(1);
        });

        it('should initialize HealthComponent with default health', () => {
            const entity = createPlayerEntity(mockScene, entityManager, playerData, 'shooter-sprite', true);

            const health = entity.getComponent(HealthComponent)!;
            expect(health.currentHealth).toBe(100);
            expect(health.maxHealth).toBe(100);
        });

        it('should initialize MovementComponent with correct values', () => {
            const entity = createPlayerEntity(mockScene, entityManager, playerData, 'shooter-sprite', true);

            const movement = entity.getComponent(MovementComponent)!;
            expect(movement.maxVelocity).toBeGreaterThan(0);
            expect(movement.acceleration).toBeGreaterThan(0);
        });

        it('should handle player with different level', () => {
            const highLevelPlayer: SpaceShip = {
                ...playerData,
                level: 3,
            };

            const entity = createPlayerEntity(mockScene, entityManager, highLevelPlayer, 'shooter-sprite', true);

            const player = entity.getComponent(PlayerComponent)!;
            expect(player.level).toBe(3);

            const weapon = entity.getComponent(WeaponComponent)!;
            expect(weapon.bulletSpriteKey).toBe('laser-level-3');
        });

        it('should handle player with default level when not specified', () => {
            const noLevelPlayer: SpaceShip = {
                id: 'player-2',
                name: 'NoLevel',
                x: 50,
                y: 50,
                ammo: 0,
            };

            const entity = createPlayerEntity(mockScene, entityManager, noLevelPlayer, 'shooter-sprite', true);

            const player = entity.getComponent(PlayerComponent)!;
            expect(player.level).toBe(1);
        });

        it('should handle player with zero ammo', () => {
            const noAmmoPlayer: SpaceShip = {
                ...playerData,
                ammo: 0,
            };

            const entity = createPlayerEntity(mockScene, entityManager, noAmmoPlayer, 'shooter-sprite', true);

            const weapon = entity.getComponent(WeaponComponent)!;
            expect(weapon.ammo).toBe(0);
        });

        it('should set sprite data with player ID', () => {
            const entity = createPlayerEntity(mockScene, entityManager, playerData, 'shooter-sprite', true);

            const transform = entity.getComponent(TransformComponent)!;
            expect(transform.sprite.setData).toHaveBeenCalledWith('id', 'player-1');
        });

        it('should initialize ColliderComponent with correct layer', () => {
            const entity = createPlayerEntity(mockScene, entityManager, playerData, 'shooter-sprite', true);

            const collider = entity.getComponent(ColliderComponent)!;
            expect(collider.layer).toBeDefined();
        });

        it('should initialize UpgradesComponent', () => {
            const entity = createPlayerEntity(mockScene, entityManager, playerData, 'shooter-sprite', true);

            const upgrades = entity.getComponent(UpgradesComponent)!;
            expect(upgrades).toBeDefined();
        });
    });

    describe('PlayerComponent', () => {
        it('should store player data correctly', () => {
            const component = new PlayerComponent('p1', 'Alice', true, 2);

            expect(component.playerId).toBe('p1');
            expect(component.playerName).toBe('Alice');
            expect(component.isLocal).toBe(true);
            expect(component.level).toBe(2);
            expect(component.score).toBe(0);
        });

        it('should default isLocal to false', () => {
            const component = new PlayerComponent('p1', 'Bob');

            expect(component.isLocal).toBe(false);
        });

        it('should default level to 1', () => {
            const component = new PlayerComponent('p1', 'Charlie', false);

            expect(component.level).toBe(1);
        });

        it('should allow setting level', () => {
            const component = new PlayerComponent('p1', 'Dave', true, 1);

            component.setLevel(3);

            expect(component.level).toBe(3);
        });

        it('should allow adding score', () => {
            const component = new PlayerComponent('p1', 'Eve', true, 1);

            component.addScore(100);
            expect(component.score).toBe(100);

            component.addScore(50);
            expect(component.score).toBe(150);
        });

        it('should accumulate score across multiple additions', () => {
            const component = new PlayerComponent('p1', 'Frank', true, 1);

            component.addScore(10);
            component.addScore(20);
            component.addScore(30);

            expect(component.score).toBe(60);
        });
    });

    describe('Integration Tests', () => {
        it('should create functional local player entity', () => {
            const playerData: SpaceShip = {
                id: 'local-1',
                name: 'LocalPlayer',
                x: 400,
                y: 300,
                level: 2,
                ammo: 100,
            };

            const entity = createPlayerEntity(mockScene, entityManager, playerData, 'shooter-sprite', true);

            // Verify all components are present and functional
            const transform = entity.getComponent(TransformComponent)!;
            const player = entity.getComponent(PlayerComponent)!;
            const weapon = entity.getComponent(WeaponComponent)!;
            const health = entity.getComponent(HealthComponent)!;

            expect(transform.sprite.x).toBe(400);
            expect(player.isLocal).toBe(true);
            expect(weapon.ammo).toBe(100);
            expect(health.currentHealth).toBe(100);
        });

        it('should create functional remote player entity', () => {
            const playerData: SpaceShip = {
                id: 'remote-1',
                name: 'RemotePlayer',
                x: 200,
                y: 150,
                level: 1,
                ammo: 0,
            };

            const entity = createPlayerEntity(mockScene, entityManager, playerData, 'shooter-sprite', false);

            // Remote player should not have weapon
            expect(entity.hasComponent(WeaponComponent)).toBe(false);

            const player = entity.getComponent(PlayerComponent)!;

            expect(player.isLocal).toBe(false);
        });

        it('should handle player level progression', () => {
            const playerData: SpaceShip = {
                id: 'prog-1',
                name: 'ProgressPlayer',
                x: 100,
                y: 100,
                level: 1,
                ammo: 50,
            };

            const entity = createPlayerEntity(mockScene, entityManager, playerData, 'shooter-sprite', true);

            const player = entity.getComponent(PlayerComponent)!;

            // Level up
            player.setLevel(2);
            expect(player.level).toBe(2);

            // Add score
            player.addScore(500);
            expect(player.score).toBe(500);
        });
    });
});
