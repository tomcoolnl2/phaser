import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityManager } from '@/ecs/core/EntityManager';
import { createPickupEntity } from '@/ecs/core/factories';
import { PickupComponent } from '@/ecs/components/PickupComponent';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { PickupType } from '@/ecs/types/PickupType';
import { PickupSystem } from '@/ecs/systems/PickupSystem';

describe('Pickup ECS', () => {
    let mockScene: any;
    let entityManager: EntityManager;

    beforeEach(() => {
        mockScene = {
            physics: {
                add: {
                    sprite: vi.fn((x: number, y: number, texture: string) => {
                        const sprite: any = {
                            x,
                            y,
                            texture,
                            width: 32,
                            height: 32,
                            rotation: 0,
                            angle: 0,
                            alpha: 1,
                            active: true,
                            visible: true,
                            body: {
                                velocity: { x: 0, y: 0 }
                            },
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
                velocityFromRotation: vi.fn((angle: number, speed: number, velocity: { x: number, y: number }) => {
                    velocity.x = Math.cos(angle) * speed;
                    velocity.y = Math.sin(angle) * speed;
                }),
            },
            scale: {
                width: 800,
                height: 600,
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

            // Assert that a tween with angle: 360 and repeat: -1 was created
            expect(mockScene.tweens.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    angle: 360,
                    repeat: -1,
                })
            );
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
            
            // Get the tweens that were created
            const tween1 = mockScene.tweens.add.mock.results[0].value;
            const tween2 = mockScene.tweens.add.mock.results[1].value;

            // Destroy sprite
            transform.sprite.destroy();

            // Update should cleanup tweens
            system.update(entity, 16);

            expect(tween1.stop).toHaveBeenCalled();
            expect(tween1.remove).toHaveBeenCalled();
            expect(tween2.stop).toHaveBeenCalled();
            expect(tween2.remove).toHaveBeenCalled();
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

            // Trigger first update to initialize animations
            entityManager.update(16);

            // Entity created with animations
            expect(mockScene.tweens.add).toHaveBeenCalledTimes(2);

            // Get the tweens that were created
            const tween1 = mockScene.tweens.add.mock.results[0].value;
            const tween2 = mockScene.tweens.add.mock.results[1].value;

            // Simulate collection
            transform.sprite.destroy();
            entityManager.update(16);

            // Should cleanup tweens
            expect(tween1.stop).toHaveBeenCalled();
            expect(tween1.remove).toHaveBeenCalled();
            expect(tween2.stop).toHaveBeenCalled();
            expect(tween2.remove).toHaveBeenCalled();
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
