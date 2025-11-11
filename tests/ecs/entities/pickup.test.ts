import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityManager, createPickupEntity } from '@/ecs/core';
import { TransformComponent, PickupComponent } from '@/ecs/components';
import { PickupType } from '@/ecs/types';
import { PickupSystem } from '@/ecs/systems';

describe('Pickup ECS', () => {
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
                particles: vi.fn((x: number, y: number, texture: string, config: any) => ({
                    x,
                    y,
                    texture,
                    config,
                    setPosition: vi.fn().mockReturnThis(),
                    destroy: vi.fn(),
                })),
            },
            tweens: {
                add: vi.fn((config: any) => ({
                    config,
                    isPlaying: vi.fn(() => true),
                    stop: vi.fn(),
                    remove: vi.fn(),
                })),
            },
        };

        entityManager = new EntityManager(mockScene);
    });

    describe('PickupComponent', () => {
        it('should store type and value', () => {
            const component = new PickupComponent(PickupType.AMMO, 10);
            expect(component.type).toBe(PickupType.AMMO);
            expect(component.value).toBe(10);
        });

        it('should use default values', () => {
            const component = new PickupComponent();
            expect(component.type).toBe(PickupType.AMMO);
            expect(component.value).toBe(10);
        });

        it('should store health pickup type', () => {
            const component = new PickupComponent(PickupType.HEALTH, 25);
            expect(component.type).toBe(PickupType.HEALTH);
            expect(component.value).toBe(25);
        });
    });

    describe('createPickupEntity', () => {
        it('should create entity with required components', () => {
            const entity = createPickupEntity(
                mockScene,
                entityManager,
                100,
                200,
                PickupType.AMMO,
                10
            );

            expect(entity.hasComponent(TransformComponent)).toBe(true);
            expect(entity.hasComponent(PickupComponent)).toBe(true);
        });

        it('should initialize sprite at correct position', () => {
            const entity = createPickupEntity(
                mockScene,
                entityManager,
                150,
                250
            );

            const transform = entity.getComponent(TransformComponent);
            expect(transform).toBeDefined();
            expect(transform!.sprite.x).toBe(150);
            expect(transform!.sprite.y).toBe(250);
            expect(mockScene.physics.add.sprite).toHaveBeenCalledWith(150, 250, 'pickup');
        });

        it('should initialize pickup component with type and value', () => {
            const entity = createPickupEntity(
                mockScene,
                entityManager,
                100,
                100,
                PickupType.HEALTH,
                25
            );

            const pickup = entity.getComponent(PickupComponent);
            expect(pickup).toBeDefined();
            expect(pickup!.type).toBe(PickupType.HEALTH);
            expect(pickup!.value).toBe(25);
        });

        it('should use default pickup values when not specified', () => {
            const entity = createPickupEntity(
                mockScene,
                entityManager,
                100,
                100
            );

            const pickup = entity.getComponent(PickupComponent);
            expect(pickup!.type).toBe(PickupType.AMMO);
            expect(pickup!.value).toBe(10);
        });
    });

    describe('PickupSystem', () => {
        it('should require correct components', () => {
            const system = new PickupSystem(mockScene);
            const required = system.getRequiredComponents();

            expect(required).toContain(TransformComponent);
            expect(required).toContain(PickupComponent);
        });

        it('should create particle emitter when entity is added', () => {
            const system = new PickupSystem(mockScene);
            const entity = createPickupEntity(
                mockScene,
                entityManager,
                100,
                100
            );

            // First update initializes particles
            system.update(entity, 16);

            expect(mockScene.add.particles).toHaveBeenCalledWith(
                100,
                100,
                'dust',
                expect.objectContaining({
                    speed: 20,
                    lifespan: 1000,
                    frequency: 100,
                })
            );

            const pickup = entity.getComponent(PickupComponent)!;
            expect(pickup.particles).not.toBeNull();
        });

        it('should create floating animation when entity is added', () => {
            const system = new PickupSystem(mockScene);
            const entity = createPickupEntity(
                mockScene,
                entityManager,
                100,
                100
            );

            // First update initializes animations
            system.update(entity, 16);

            expect(mockScene.tweens.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    targets: expect.anything(),
                    y: 90, // 100 - 10
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                })
            );
        });

        it('should create rotation animation when entity is added', () => {
            const system = new PickupSystem(mockScene);
            const entity = createPickupEntity(
                mockScene,
                entityManager,
                100,
                100
            );

            // First update initializes animations
            system.update(entity, 16);

            expect(mockScene.tweens.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    targets: expect.anything(),
                    angle: 360,
                    duration: 2000,
                    repeat: -1,
                })
            );
        });

        it('should cleanup particles when entity is removed', () => {
            const system = new PickupSystem(mockScene);
            const entity = createPickupEntity(
                mockScene,
                entityManager,
                100,
                100
            );

            // First update initializes particles
            system.update(entity, 16);
            const pickup = entity.getComponent(PickupComponent)!;
            const particles = pickup.particles!;

            system.onEntityRemoved(entity);

            expect(particles.destroy).toHaveBeenCalled();
            expect(pickup.particles).toBeNull();
        });

        it('should stop tweens when entity is removed', () => {
            const system = new PickupSystem(mockScene);
            const entity = createPickupEntity(
                mockScene,
                entityManager,
                100,
                100
            );

            // First update initializes animations
            system.update(entity, 16);
            
            // Get the tweens that were created
            const tween1 = mockScene.tweens.add.mock.results[0].value;
            const tween2 = mockScene.tweens.add.mock.results[1].value;

            system.onEntityRemoved(entity);

            expect(tween1.stop).toHaveBeenCalled();
            expect(tween1.remove).toHaveBeenCalled();
            expect(tween2.stop).toHaveBeenCalled();
            expect(tween2.remove).toHaveBeenCalled();
        });

        it('should update particles position during float animation', () => {
            const system = new PickupSystem(mockScene);
            const entity = createPickupEntity(
                mockScene,
                entityManager,
                100,
                100
            );

            // First update initializes animations
            system.update(entity, 16);

            // Get the float tween config
            const floatTween = mockScene.tweens.add.mock.calls[0][0];
            expect(floatTween.onUpdate).toBeDefined();

            // Mock particle position update
            const pickup = entity.getComponent(PickupComponent)!;
            const particles = pickup.particles!;

            // Simulate sprite movement
            const transform = entity.getComponent(TransformComponent)!;
            transform.sprite.y = 90;

            // Call the onUpdate callback
            floatTween.onUpdate();

            expect(particles.setPosition).toHaveBeenCalledWith(100, 90);
        });

        it('should detect when sprite is destroyed', () => {
            const system = new PickupSystem(mockScene);
            const entity = createPickupEntity(
                mockScene,
                entityManager,
                100,
                100
            );

            // First update initializes animations
            system.update(entity, 16);
            const transform = entity.getComponent(TransformComponent)!;
            const pickup = entity.getComponent(PickupComponent)!;

            // Destroy sprite
            transform.sprite.destroy();

            // Update should cleanup
            system.update(entity, 16);

            expect(pickup.particles).toBeNull();
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete pickup lifecycle', () => {
            const system = new PickupSystem(mockScene);
            entityManager.addSystem(system);

            const entity = createPickupEntity(
                mockScene,
                entityManager,
                100,
                100,
                PickupType.AMMO,
                10
            );

            const transform = entity.getComponent(TransformComponent)!;
            const pickup = entity.getComponent(PickupComponent)!;

            // Trigger first update to initialize animations
            entityManager.update(16);

            // Entity created with animations
            expect(pickup.particles).not.toBeNull();
            expect(mockScene.tweens.add).toHaveBeenCalledTimes(2);

            // Simulate collection
            transform.sprite.destroy();
            entityManager.update(16);

            // Should cleanup
            expect(pickup.particles).toBeNull();
        });

        it('should create pickup with custom type and value', () => {
            const entity = createPickupEntity(
                mockScene,
                entityManager,
                200,
                300,
                PickupType.HEALTH,
                50
            );

            const pickup = entity.getComponent(PickupComponent)!;
            expect(pickup.type).toBe(PickupType.HEALTH);
            expect(pickup.value).toBe(50);
        });
    });
});
