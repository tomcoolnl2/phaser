import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WeaponSystem } from '@/ecs/systems/WeaponSystem';
import { EntityManager } from '@/ecs/core/EntityManager';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';

describe('WeaponSystem', () => {
    let mockScene: any;
    let entityManager: EntityManager;
    let weaponSystem: WeaponSystem;
    let mockBulletGroup: any;
    let mockBullet: any;

    beforeEach(() => {
        // Mock bullet sprite
        mockBullet = {
            x: 0,
            y: 0,
            active: false,
            visible: false,
            body: {
                velocity: { x: 0, y: 0 },
            },
            setActive: vi.fn(function (this: any, active: boolean) {
                this.active = active;
                return this;
            }),
            setVisible: vi.fn(function (this: any, visible: boolean) {
                this.visible = visible;
                return this;
            }),
            setRotation: vi.fn().mockReturnThis(),
            setTexture: vi.fn().mockReturnThis(),
            setData: vi.fn().mockReturnThis(),
        };

        // Mock bullet group
        mockBulletGroup = {
            get: vi.fn((x: number, y: number, texture: string) => {
                mockBullet.x = x;
                mockBullet.y = y;
                return mockBullet;
            }),
        };

        // Mock Phaser scene
        mockScene = {
            physics: {
                add: {
                    sprite: vi.fn((x: number, y: number, texture: string) => ({
                        x,
                        y,
                        texture,
                        rotation: 0,
                        body: {
                            velocity: { x: 0, y: 0 },
                        },
                        setOrigin: vi.fn().mockReturnThis(),
                        destroy: vi.fn(),
                    })),
                    group: vi.fn(() => mockBulletGroup),
                },
                velocityFromRotation: vi.fn((rotation: number, speed: number, vec: any) => {
                    vec.x = Math.cos(rotation) * speed;
                    vec.y = Math.sin(rotation) * speed;
                    return vec;
                }),
            },
            time: {
                delayedCall: vi.fn(),
            },
        };

        entityManager = new EntityManager(mockScene);
        weaponSystem = new WeaponSystem(mockScene);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Component Requirements', () => {
        it('should require TransformComponent and WeaponComponent', () => {
            const required = weaponSystem.getRequiredComponents();

            expect(required).toContain(TransformComponent);
            expect(required).toContain(WeaponComponent);
            expect(required).toHaveLength(2);
        });
    });

    describe('Trigger Behavior', () => {
        it('should not fire when trigger is not pulled', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = false;
            entity.addComponent(weapon);

            weaponSystem.update(entity, 16);

            expect(mockBulletGroup.get).not.toHaveBeenCalled();
        });

        it('should fire when trigger is pulled and weapon can fire', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            weaponSystem.update(entity, 16);

            expect(mockBulletGroup.get).toHaveBeenCalledWith(100, 100, 'laser');
        });
    });

    describe('Fire Rate Limiting', () => {
        it('should not fire if fired too recently', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            // Fire once
            weaponSystem.update(entity, 16);
            expect(mockBulletGroup.get).toHaveBeenCalledTimes(1);

            // Try to fire immediately again
            weaponSystem.update(entity, 16);
            expect(mockBulletGroup.get).toHaveBeenCalledTimes(1); // Should not fire again
        });

        it('should fire again after fire rate cooldown', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            // Fire once
            weaponSystem.update(entity, 16);
            expect(mockBulletGroup.get).toHaveBeenCalledTimes(1);

            // Wait for fire rate cooldown (500ms)
            weapon.lastFired -= 600;

            // Try to fire again
            weaponSystem.update(entity, 16);
            expect(mockBulletGroup.get).toHaveBeenCalledTimes(2); // Should fire again
        });
    });

    describe('Ammo Consumption', () => {
        it('should not fire when ammo is 0', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 0, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            weaponSystem.update(entity, 16);

            expect(mockBulletGroup.get).not.toHaveBeenCalled();
        });

        it('should consume ammo when firing', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            weaponSystem.update(entity, 16);

            expect(weapon.ammo).toBe(49);
        });

        it('should not fire when ammo becomes 0', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 1, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            // Fire once (should succeed)
            weaponSystem.update(entity, 16);
            expect(mockBulletGroup.get).toHaveBeenCalledTimes(1);
            expect(weapon.ammo).toBe(0);

            // Wait for cooldown
            weapon.lastFired -= 600;

            // Try to fire again (should fail - no ammo)
            weaponSystem.update(entity, 16);
            expect(mockBulletGroup.get).toHaveBeenCalledTimes(1); // Still 1
        });
    });

    describe('Bullet Spawning', () => {
        it('should spawn bullet at sprite position', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(150, 250, 'ship');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            weaponSystem.update(entity, 16);

            expect(mockBulletGroup.get).toHaveBeenCalledWith(150, 250, 'laser');
        });

        it('should set bullet texture', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser-level-2');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            weaponSystem.update(entity, 16);

            expect(mockBullet.setTexture).toHaveBeenCalledWith('laser-level-2');
        });

        it('should activate and show bullet', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            weaponSystem.update(entity, 16);

            expect(mockBullet.setActive).toHaveBeenCalledWith(true);
            expect(mockBullet.setVisible).toHaveBeenCalledWith(true);
        });

        it('should rotate bullet based on sprite rotation', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            sprite.rotation = Math.PI / 4; // 45 degrees
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            weaponSystem.update(entity, 16);

            // Bullet rotation = sprite rotation + 90° offset
            const expectedRotation = Math.PI / 4 + Math.PI / 2;
            expect(mockBullet.setRotation).toHaveBeenCalledWith(expectedRotation);
        });

        it('should set bullet velocity based on rotation and speed', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            sprite.rotation = 0;
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            weaponSystem.update(entity, 16);

            expect(mockScene.physics.velocityFromRotation).toHaveBeenCalledWith(
                0,
                400,
                mockBullet.body.velocity
            );
        });

        it('should store damage in bullet data', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 3, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            weaponSystem.update(entity, 16);

            expect(mockBullet.setData).toHaveBeenCalledWith('damage', 3);
        });

        it('should schedule bullet cleanup after 2 seconds', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            weaponSystem.update(entity, 16);

            expect(mockScene.time.delayedCall).toHaveBeenCalledWith(
                2000,
                expect.any(Function)
            );
        });
    });

    describe('Missing Components', () => {
        it('should handle missing sprite', () => {
            const entity = entityManager.createEntity();

            const transform = new TransformComponent(null as any);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            expect(() => weaponSystem.update(entity, 16)).not.toThrow();
            expect(mockBulletGroup.get).not.toHaveBeenCalled();
        });

        it('should handle null bullet from pool', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            // Mock bullet pool returning null
            mockBulletGroup.get.mockReturnValue(null);

            expect(() => weaponSystem.update(entity, 16)).not.toThrow();
        });
    });

    describe('Integration with EntityManager', () => {
        it('should work when added to EntityManager', () => {
            entityManager.addSystem(weaponSystem);

            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'ship');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon.triggerPulled = true;
            entity.addComponent(weapon);

            entityManager.update(16);

            expect(mockBulletGroup.get).toHaveBeenCalled();
            expect(weapon.ammo).toBe(49);
        });

        it('should fire multiple bullets from multiple entities', () => {
            entityManager.addSystem(weaponSystem);

            // Entity 1
            const entity1 = entityManager.createEntity();
            const sprite1 = mockScene.physics.add.sprite(100, 100, 'ship');
            const transform1 = new TransformComponent(sprite1);
            entity1.addComponent(transform1);
            const weapon1 = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon1.triggerPulled = true;
            entity1.addComponent(weapon1);

            // Entity 2
            const entity2 = entityManager.createEntity();
            const sprite2 = mockScene.physics.add.sprite(200, 200, 'ship');
            const transform2 = new TransformComponent(sprite2);
            entity2.addComponent(transform2);
            const weapon2 = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1, 'laser');
            weapon2.triggerPulled = true;
            entity2.addComponent(weapon2);

            entityManager.update(16);

            expect(mockBulletGroup.get).toHaveBeenCalledTimes(2);
            expect(weapon1.ammo).toBe(49);
            expect(weapon2.ammo).toBe(49);
        });
    });
});
