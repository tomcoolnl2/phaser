import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityManager, createAsteroidEntity } from '@/ecs/core';
import { TransformComponent, HealthComponent, ColliderComponent, AsteroidComponent } from '@/ecs/components';
import { AsteroidSystem } from '@/ecs/systems';
import { GameConfig } from '@shared/config';

describe('Asteroid ECS', () => {
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
                            alpha: 1,
                            active: true,
                            visible: true,
                            setOrigin: vi.fn().mockReturnThis(),
                            setCollideWorldBounds: vi.fn().mockReturnThis(),
                            setImmovable: vi.fn().mockReturnThis(),
                            setMaxVelocity: vi.fn().mockReturnThis(),
                            setData: vi.fn().mockReturnThis(),
                            play: vi.fn().mockReturnThis(),
                            setPosition: vi.fn(function(this: any, newX: number, newY: number) {
                                this.x = newX;
                                this.y = newY;
                                return this;
                            }),
                            destroy: vi.fn(function(this: any) {
                                this.active = false;
                                this.visible = false;
                            }),
                        };
                        return sprite;
                    }),
                },
            },
            add: {
                sprite: vi.fn((x: number, y: number, texture: string) => ({
                    x,
                    y,
                    texture,
                    play: vi.fn().mockReturnThis(),
                    once: vi.fn((event: string, callback: Function) => {
                        if (event === 'animationcomplete') {
                            setTimeout(() => callback(), 0);
                        }
                    }),
                    destroy: vi.fn(),
                })),
                text: vi.fn((x: number, y: number, text: string, style: any) => ({
                    x,
                    y,
                    text,
                    style,
                    setOrigin: vi.fn().mockReturnThis(),
                    setVisible: vi.fn().mockReturnThis(),
                    setPosition: vi.fn().mockReturnThis(),
                    setText: vi.fn().mockReturnThis(),
                    setColor: vi.fn().mockReturnThis(),
                    destroy: vi.fn(),
                })),
            },
            tweens: {
                add: vi.fn((config: any) => ({
                    config,
                    stop: vi.fn(),
                    remove: vi.fn(),
                    isPlaying: vi.fn(() => false),
                })),
            },
        };

        entityManager = new EntityManager(mockScene);
    });

    describe('AsteroidComponent', () => {
        it('should store asteroid ID', () => {
            const component = new AsteroidComponent('asteroid-123');
            expect(component.asteroidId).toBe('asteroid-123');
        });
    });

    describe('createAsteroidEntity', () => {
        it('should create entity with all required components', () => {
            const entity = createAsteroidEntity(
                mockScene,
                entityManager,
                'ast-1',
                100,
                200
            );

            expect(entity.hasComponent(TransformComponent)).toBe(true);
            expect(entity.hasComponent(HealthComponent)).toBe(true);
            expect(entity.hasComponent(ColliderComponent)).toBe(true);
            expect(entity.hasComponent(AsteroidComponent)).toBe(true);
        });

        it('should initialize sprite with correct properties', () => {
            const entity = createAsteroidEntity(
                mockScene,
                entityManager,
                'ast-1',
                150,
                250
            );

            const transform = entity.getComponent(TransformComponent);
            expect(transform).toBeDefined();
            expect(transform!.sprite.x).toBe(150);
            expect(transform!.sprite.y).toBe(250);
            expect(mockScene.physics.add.sprite).toHaveBeenCalledWith(150, 250, 'asteroid');
        });

        it('should initialize health correctly', () => {
            const entity = createAsteroidEntity(
                mockScene,
                entityManager,
                'ast-1',
                100,
                100
            );

            const health = entity.getComponent(HealthComponent);
            expect(health).toBeDefined();
            expect(health!.currentHealth).toBe(GameConfig.asteroid.health);
            expect(health!.maxHealth).toBe(GameConfig.asteroid.health);
        });

        it('should initialize asteroid component with ID', () => {
            const entity = createAsteroidEntity(
                mockScene,
                entityManager,
                'asteroid-xyz',
                100,
                100
            );

            const asteroid = entity.getComponent(AsteroidComponent);
            expect(asteroid).toBeDefined();
            expect(asteroid!.asteroidId).toBe('asteroid-xyz');
        });

        it('should set sprite to play asteroid-spin animation', () => {
            const entity = createAsteroidEntity(
                mockScene,
                entityManager,
                'ast-1',
                100,
                100
            );

            const transform = entity.getComponent(TransformComponent);
            expect(transform!.sprite.play).toHaveBeenCalledWith('asteroid-spin');
        });
    });

    describe('AsteroidSystem', () => {
        it('should require correct components', () => {
            const system = new AsteroidSystem(mockScene);
            const required = system.getRequiredComponents();

            expect(required).toContain(TransformComponent);
            expect(required).toContain(AsteroidComponent);
            expect(required).toContain(HealthComponent);
        });

        it('should create health text when entity is updated', () => {
            const system = new AsteroidSystem(mockScene);
            const entity = createAsteroidEntity(
                mockScene,
                entityManager,
                'ast-1',
                100,
                100
            );

            system.update(entity, 16);

            expect(mockScene.add.text).toHaveBeenCalled();
        });

        it('should update health text position to follow sprite', () => {
            const system = new AsteroidSystem(mockScene);
            const entity = createAsteroidEntity(
                mockScene,
                entityManager,
                'ast-1',
                100,
                100
            );

            // First update creates health text
            system.update(entity, 16);

            // Move sprite
            const transform = entity.getComponent(TransformComponent)!;
            transform.sprite.setPosition(200, 300);

            // Second update should update text position
            system.update(entity, 16);

            const textCall = mockScene.add.text.mock.results[0].value;
            expect(textCall.setPosition).toHaveBeenCalledWith(200, 380); // sprite.y + 80
        });

        it('should change health text color based on damage', () => {
            const system = new AsteroidSystem(mockScene);
            const entity = createAsteroidEntity(
                mockScene,
                entityManager,
                'ast-1',
                100,
                100
            );

            // Initial update (3 HP - green)
            system.update(entity, 16);
            let textCall = mockScene.add.text.mock.results[0].value;
            expect(textCall.setColor).toHaveBeenCalledWith('#00ff00');

            // Damage to 2 HP
            const health = entity.getComponent(HealthComponent)!;
            health.takeDamage(1);
            system.update(entity, 16);
            expect(textCall.setColor).toHaveBeenCalledWith('#ffff00'); // Yellow

            // Damage to 1 HP
            health.takeDamage(1);
            system.update(entity, 16);
            expect(textCall.setColor).toHaveBeenCalledWith('#ff0000'); // Red
        });

        it('should destroy asteroid when health reaches 0', () => {
            const system = new AsteroidSystem(mockScene);
            const entity = createAsteroidEntity(
                mockScene,
                entityManager,
                'ast-1',
                100,
                100
            );

            const transform = entity.getComponent(TransformComponent)!;
            const health = entity.getComponent(HealthComponent)!;

            // Damage to death
            health.takeDamage(3);
            system.update(entity, 16);

            expect(transform.sprite.destroy).toHaveBeenCalled();
            expect(mockScene.add.sprite).toHaveBeenCalledWith(100, 100, 'kaboom-big');
        });

        it('should flash asteroid sprite when hit', () => {
            const system = new AsteroidSystem(mockScene);
            const entity = createAsteroidEntity(
                mockScene,
                entityManager,
                'ast-1',
                100,
                100
            );

            const transform = entity.getComponent(TransformComponent)!;
            system.flashAsteroid(transform.sprite);

            expect(mockScene.tweens.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    targets: transform.sprite,
                    alpha: 0.5,
                    duration: 100,
                    yoyo: true,
                    repeat: 1,
                })
            );
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete asteroid lifecycle', () => {
            const system = new AsteroidSystem(mockScene);
            entityManager.addSystem(system);

            const entity = createAsteroidEntity(
                mockScene,
                entityManager,
                'ast-1',
                100,
                100
            );

            const health = entity.getComponent(HealthComponent)!;
            const transform = entity.getComponent(TransformComponent)!;

            // Entity starts with full health
            expect(health.currentHealth).toBe(3);
            expect(transform.sprite.active).toBe(true);

            // Hit asteroid 3 times
            health.takeDamage(1);
            entityManager.update(16);
            expect(health.currentHealth).toBe(2);

            health.takeDamage(1);
            entityManager.update(16);
            expect(health.currentHealth).toBe(1);

            health.takeDamage(1);
            entityManager.update(16);

            // Should be destroyed
            expect(health.isDead()).toBe(true);
            expect(transform.sprite.active).toBe(false);
        });
    });
});
