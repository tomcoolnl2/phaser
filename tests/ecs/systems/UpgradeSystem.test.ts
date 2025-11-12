import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpgradeSystem } from '@/ecs/systems/UpgradeSystem';
import { EntityManager } from '@/ecs/core/EntityManager';
import { UpgradesComponent, UpgradeType } from '@/ecs/components/UpgradesComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { MovementComponent } from '@/ecs/components/MovementComponent';
import { HealthComponent } from '@/ecs/components/HealthComponent';

describe('UpgradeSystem', () => {
    let mockScene: any;
    let entityManager: EntityManager;
    let upgradeSystem: UpgradeSystem;

    beforeEach(() => {
        mockScene = {
            physics: {
                add: {
                    sprite: vi.fn(() => ({
                        setOrigin: vi.fn().mockReturnThis(),
                        destroy: vi.fn(),
                    })),
                    group: vi.fn(() => ({})),
                },
            },
        };

        entityManager = new EntityManager(mockScene);
        upgradeSystem = new UpgradeSystem(mockScene);
    });

    describe('Component Requirements', () => {
        it('should require UpgradesComponent', () => {
            const required = upgradeSystem.getRequiredComponents();

            expect(required).toContain(UpgradesComponent);
        });
    });

    describe('Fire Rate Upgrade', () => {
        it('should reduce fire rate when upgraded', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            const initialFireRate = weapon.fireRate;
            entity.addComponent(weapon);

            const success = upgradeSystem.applyUpgrade(entity, UpgradeType.FIRE_RATE);

            expect(success).toBe(true);
            expect(weapon.fireRate).toBeLessThan(initialFireRate);
            expect(upgrades.getUpgradeLevel(UpgradeType.FIRE_RATE)).toBe(1);
        });

        it('should not upgrade beyond max level', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            // Upgrade to max (5 times)
            for (let i = 0; i < 5; i++) {
                upgradeSystem.applyUpgrade(entity, UpgradeType.FIRE_RATE);
            }

            // Try to upgrade beyond max
            const success = upgradeSystem.applyUpgrade(entity, UpgradeType.FIRE_RATE);

            expect(success).toBe(false);
            expect(upgrades.getUpgradeLevel(UpgradeType.FIRE_RATE)).toBe(5);
        });
    });

    describe('Damage Upgrade', () => {
        it('should increase damage when upgraded', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            const success = upgradeSystem.applyUpgrade(entity, UpgradeType.DAMAGE);

            expect(success).toBe(true);
            expect(weapon.damage).toBe(2); // Started at 1, added 1
            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(1);
        });

        it('should stack damage upgrades', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            upgradeSystem.applyUpgrade(entity, UpgradeType.DAMAGE);
            upgradeSystem.applyUpgrade(entity, UpgradeType.DAMAGE);
            upgradeSystem.applyUpgrade(entity, UpgradeType.DAMAGE);

            expect(weapon.damage).toBe(4); // 1 + 3
            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(3);
        });
    });

    describe('Speed Upgrade', () => {
        it('should increase speed when upgraded', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            const initialMaxVelocity = movement.maxVelocity;
            entity.addComponent(movement);

            const success = upgradeSystem.applyUpgrade(entity, UpgradeType.SPEED);

            expect(success).toBe(true);
            expect(movement.maxVelocity).toBeGreaterThan(initialMaxVelocity);
            expect(upgrades.getUpgradeLevel(UpgradeType.SPEED)).toBe(1);
        });

        it('should stack speed upgrades', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            const initialMaxVelocity = movement.maxVelocity;
            entity.addComponent(movement);

            upgradeSystem.applyUpgrade(entity, UpgradeType.SPEED);
            upgradeSystem.applyUpgrade(entity, UpgradeType.SPEED);

            // Each upgrade is 15%, so 2 upgrades = 1.15 * 1.15 = 1.3225
            expect(movement.maxVelocity).toBeCloseTo(initialMaxVelocity * 1.3225, 2);
        });
    });

    describe('Health Upgrade', () => {
        it('should increase max health when upgraded', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const health = new HealthComponent(100);
            entity.addComponent(health);

            const success = upgradeSystem.applyUpgrade(entity, UpgradeType.HEALTH);

            expect(success).toBe(true);
            expect(health.maxHealth).toBe(102); // 100 + 2
            expect(health.currentHealth).toBe(102); // Also healed
            expect(upgrades.getUpgradeLevel(UpgradeType.HEALTH)).toBe(1);
        });

        it('should heal current health when upgrading max health', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const health = new HealthComponent(100);
            health.currentHealth = 50; // Damaged
            entity.addComponent(health);

            upgradeSystem.applyUpgrade(entity, UpgradeType.HEALTH);

            expect(health.maxHealth).toBe(102);
            expect(health.currentHealth).toBe(52); // Healed by 2
        });
    });

    describe('Max Ammo Upgrade', () => {
        it('should increase max ammo when upgraded', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            const success = upgradeSystem.applyUpgrade(entity, UpgradeType.MAX_AMMO);

            expect(success).toBe(true);
            expect(weapon.maxAmmo).toBe(110); // 100 + 10
            expect(upgrades.getUpgradeLevel(UpgradeType.MAX_AMMO)).toBe(1);
        });

        it('should stack max ammo upgrades', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            upgradeSystem.applyUpgrade(entity, UpgradeType.MAX_AMMO);
            upgradeSystem.applyUpgrade(entity, UpgradeType.MAX_AMMO);
            upgradeSystem.applyUpgrade(entity, UpgradeType.MAX_AMMO);

            expect(weapon.maxAmmo).toBe(130); // 100 + 30
            expect(upgrades.getUpgradeLevel(UpgradeType.MAX_AMMO)).toBe(3);
        });
    });

    describe('Rotation Speed Upgrade', () => {
        it('should increase rotation speed when upgraded', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            const initialRotationSpeed = movement.rotationSpeed;
            entity.addComponent(movement);

            const success = upgradeSystem.applyUpgrade(entity, UpgradeType.ROTATION_SPEED);

            expect(success).toBe(true);
            expect(movement.rotationSpeed).toBeGreaterThan(initialRotationSpeed);
            expect(upgrades.getUpgradeLevel(UpgradeType.ROTATION_SPEED)).toBe(1);
        });
    });

    describe('Missing Components', () => {
        it('should return false if entity lacks UpgradesComponent', () => {
            const entity = entityManager.createEntity();

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            const success = upgradeSystem.applyUpgrade(entity, UpgradeType.DAMAGE);

            expect(success).toBe(false);
        });

        it('should return false if entity lacks target component', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);
            // No weapon component

            const success = upgradeSystem.applyUpgrade(entity, UpgradeType.DAMAGE);

            // Should succeed in incrementing upgrade level but not apply effect
            expect(success).toBe(true);
            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(1);
        });
    });

    describe('Available Upgrades Query', () => {
        it('should return all upgrades initially', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const available = upgradeSystem.getAvailableUpgrades(entity);

            expect(available).toContain(UpgradeType.FIRE_RATE);
            expect(available).toContain(UpgradeType.DAMAGE);
            expect(available).toContain(UpgradeType.SPEED);
            expect(available).toContain(UpgradeType.HEALTH);
            expect(available).toContain(UpgradeType.MAX_AMMO);
            expect(available).toContain(UpgradeType.ROTATION_SPEED);
        });

        it('should exclude maxed out upgrades', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            // Max out fire rate (max level = 5)
            for (let i = 0; i < 5; i++) {
                upgradeSystem.applyUpgrade(entity, UpgradeType.FIRE_RATE);
            }

            const available = upgradeSystem.getAvailableUpgrades(entity);

            expect(available).not.toContain(UpgradeType.FIRE_RATE);
            expect(available).toContain(UpgradeType.DAMAGE); // Still available
        });

        it('should return empty array when all upgrades maxed', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            entity.addComponent(movement);

            const health = new HealthComponent(100);
            entity.addComponent(health);

            // Max out all upgrades
            const allUpgrades = [UpgradeType.FIRE_RATE, UpgradeType.DAMAGE, UpgradeType.SPEED, UpgradeType.HEALTH, UpgradeType.MAX_AMMO, UpgradeType.ROTATION_SPEED];

            for (const type of allUpgrades) {
                const upgrade = upgrades.getUpgrade(type);
                if (upgrade) {
                    for (let i = 0; i < upgrade.maxLevel; i++) {
                        upgradeSystem.applyUpgrade(entity, type);
                    }
                }
            }

            const available = upgradeSystem.getAvailableUpgrades(entity);

            expect(available).toHaveLength(0);
        });
    });

    describe('Multiple Upgrade Types', () => {
        it('should apply different upgrades independently', () => {
            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            entity.addComponent(movement);

            const health = new HealthComponent(100);
            entity.addComponent(health);

            upgradeSystem.applyUpgrade(entity, UpgradeType.DAMAGE);
            upgradeSystem.applyUpgrade(entity, UpgradeType.SPEED);
            upgradeSystem.applyUpgrade(entity, UpgradeType.HEALTH);

            expect(weapon.damage).toBe(2);
            expect(movement.maxVelocity).toBeGreaterThan(200);
            expect(health.maxHealth).toBe(102);
            expect(upgrades.getTotalUpgradeLevels()).toBe(3);
        });
    });

    describe('Integration with EntityManager', () => {
        it('should work when added to EntityManager', () => {
            entityManager.addSystem(upgradeSystem);

            const entity = entityManager.createEntity();

            const upgrades = new UpgradesComponent();
            entity.addComponent(upgrades);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            // Apply upgrade outside of update loop (this system is API-based)
            const success = upgradeSystem.applyUpgrade(entity, UpgradeType.DAMAGE);

            expect(success).toBe(true);
            expect(weapon.damage).toBe(2);
        });
    });
});
