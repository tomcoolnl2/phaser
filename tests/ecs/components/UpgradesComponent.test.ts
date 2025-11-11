import { describe, it, expect } from 'vitest';
import { UpgradesComponent, UpgradeType } from '@/ecs/components';

describe('UpgradesComponent', () => {
    describe('Initialization', () => {
        it('should initialize with all upgrade types at level 0', () => {
            const upgrades = new UpgradesComponent();

            expect(upgrades.getUpgradeLevel(UpgradeType.FIRE_RATE)).toBe(0);
            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(0);
            expect(upgrades.getUpgradeLevel(UpgradeType.SPEED)).toBe(0);
            expect(upgrades.getUpgradeLevel(UpgradeType.HEALTH)).toBe(0);
            expect(upgrades.getUpgradeLevel(UpgradeType.MAX_AMMO)).toBe(0);
            expect(upgrades.getUpgradeLevel(UpgradeType.ROTATION_SPEED)).toBe(0);
        });

        it('should have correct max levels for each upgrade type', () => {
            const upgrades = new UpgradesComponent();

            expect(upgrades.getUpgrade(UpgradeType.FIRE_RATE)?.maxLevel).toBe(5);
            expect(upgrades.getUpgrade(UpgradeType.DAMAGE)?.maxLevel).toBe(10);
            expect(upgrades.getUpgrade(UpgradeType.SPEED)?.maxLevel).toBe(5);
            expect(upgrades.getUpgrade(UpgradeType.HEALTH)?.maxLevel).toBe(5);
            expect(upgrades.getUpgrade(UpgradeType.MAX_AMMO)?.maxLevel).toBe(10);
            expect(upgrades.getUpgrade(UpgradeType.ROTATION_SPEED)?.maxLevel).toBe(3);
        });

        it('should have correct value per level for each upgrade type', () => {
            const upgrades = new UpgradesComponent();

            expect(upgrades.getUpgrade(UpgradeType.FIRE_RATE)?.valuePerLevel).toBe(0.1);
            expect(upgrades.getUpgrade(UpgradeType.DAMAGE)?.valuePerLevel).toBe(1);
            expect(upgrades.getUpgrade(UpgradeType.SPEED)?.valuePerLevel).toBe(0.15);
            expect(upgrades.getUpgrade(UpgradeType.HEALTH)?.valuePerLevel).toBe(2);
            expect(upgrades.getUpgrade(UpgradeType.MAX_AMMO)?.valuePerLevel).toBe(10);
            expect(upgrades.getUpgrade(UpgradeType.ROTATION_SPEED)?.valuePerLevel).toBe(0.2);
        });
    });

    describe('canUpgrade()', () => {
        it('should return true for upgrades at level 0', () => {
            const upgrades = new UpgradesComponent();

            expect(upgrades.canUpgrade(UpgradeType.FIRE_RATE)).toBe(true);
            expect(upgrades.canUpgrade(UpgradeType.DAMAGE)).toBe(true);
            expect(upgrades.canUpgrade(UpgradeType.SPEED)).toBe(true);
        });

        it('should return false when at max level', () => {
            const upgrades = new UpgradesComponent();

            // Max out rotation speed (max level 3)
            upgrades.upgrade(UpgradeType.ROTATION_SPEED);
            upgrades.upgrade(UpgradeType.ROTATION_SPEED);
            upgrades.upgrade(UpgradeType.ROTATION_SPEED);

            expect(upgrades.canUpgrade(UpgradeType.ROTATION_SPEED)).toBe(false);
        });

        it('should return true when one below max level', () => {
            const upgrades = new UpgradesComponent();

            // Upgrade to level 4 (max is 5)
            for (let i = 0; i < 4; i++) {
                upgrades.upgrade(UpgradeType.FIRE_RATE);
            }

            expect(upgrades.canUpgrade(UpgradeType.FIRE_RATE)).toBe(true);
        });

        it('should return false for invalid upgrade type', () => {
            const upgrades = new UpgradesComponent();

            expect(upgrades.canUpgrade('INVALID' as UpgradeType)).toBe(false);
        });
    });

    describe('upgrade()', () => {
        it('should increment level by 1', () => {
            const upgrades = new UpgradesComponent();

            const success = upgrades.upgrade(UpgradeType.DAMAGE);

            expect(success).toBe(true);
            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(1);
        });

        it('should allow multiple upgrades', () => {
            const upgrades = new UpgradesComponent();

            upgrades.upgrade(UpgradeType.DAMAGE);
            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(1);

            upgrades.upgrade(UpgradeType.DAMAGE);
            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(2);

            upgrades.upgrade(UpgradeType.DAMAGE);
            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(3);
        });

        it('should return false when already at max level', () => {
            const upgrades = new UpgradesComponent();

            // Max out rotation speed (max level 3)
            upgrades.upgrade(UpgradeType.ROTATION_SPEED);
            upgrades.upgrade(UpgradeType.ROTATION_SPEED);
            upgrades.upgrade(UpgradeType.ROTATION_SPEED);

            const success = upgrades.upgrade(UpgradeType.ROTATION_SPEED);

            expect(success).toBe(false);
            expect(upgrades.getUpgradeLevel(UpgradeType.ROTATION_SPEED)).toBe(3);
        });

        it('should not increment level beyond max', () => {
            const upgrades = new UpgradesComponent();

            // Try to upgrade beyond max
            for (let i = 0; i < 10; i++) {
                upgrades.upgrade(UpgradeType.ROTATION_SPEED);
            }

            expect(upgrades.getUpgradeLevel(UpgradeType.ROTATION_SPEED)).toBe(3); // Max level
        });

        it('should return false for invalid upgrade type', () => {
            const upgrades = new UpgradesComponent();

            const success = upgrades.upgrade('INVALID' as UpgradeType);

            expect(success).toBe(false);
        });

        it('should allow upgrading different types independently', () => {
            const upgrades = new UpgradesComponent();

            upgrades.upgrade(UpgradeType.DAMAGE);
            upgrades.upgrade(UpgradeType.SPEED);
            upgrades.upgrade(UpgradeType.DAMAGE);

            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(2);
            expect(upgrades.getUpgradeLevel(UpgradeType.SPEED)).toBe(1);
            expect(upgrades.getUpgradeLevel(UpgradeType.HEALTH)).toBe(0);
        });
    });

    describe('getUpgrade()', () => {
        it('should return upgrade configuration', () => {
            const upgrades = new UpgradesComponent();

            const upgrade = upgrades.getUpgrade(UpgradeType.DAMAGE);

            expect(upgrade).toBeDefined();
            expect(upgrade?.type).toBe(UpgradeType.DAMAGE);
            expect(upgrade?.level).toBe(0);
            expect(upgrade?.maxLevel).toBe(10);
            expect(upgrade?.valuePerLevel).toBe(1);
        });

        it('should reflect current level after upgrades', () => {
            const upgrades = new UpgradesComponent();

            upgrades.upgrade(UpgradeType.DAMAGE);
            upgrades.upgrade(UpgradeType.DAMAGE);

            const upgrade = upgrades.getUpgrade(UpgradeType.DAMAGE);

            expect(upgrade?.level).toBe(2);
        });

        it('should return undefined for invalid upgrade type', () => {
            const upgrades = new UpgradesComponent();

            const upgrade = upgrades.getUpgrade('INVALID' as UpgradeType);

            expect(upgrade).toBeUndefined();
        });

        it('should return different configurations for different types', () => {
            const upgrades = new UpgradesComponent();

            const fireRate = upgrades.getUpgrade(UpgradeType.FIRE_RATE);
            const damage = upgrades.getUpgrade(UpgradeType.DAMAGE);

            expect(fireRate?.maxLevel).toBe(5);
            expect(damage?.maxLevel).toBe(10);
            expect(fireRate?.valuePerLevel).toBe(0.1);
            expect(damage?.valuePerLevel).toBe(1);
        });
    });

    describe('getUpgradeLevel()', () => {
        it('should return 0 for unupgraded type', () => {
            const upgrades = new UpgradesComponent();

            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(0);
        });

        it('should return current level after upgrades', () => {
            const upgrades = new UpgradesComponent();

            upgrades.upgrade(UpgradeType.DAMAGE);
            upgrades.upgrade(UpgradeType.DAMAGE);
            upgrades.upgrade(UpgradeType.DAMAGE);

            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(3);
        });

        it('should return 0 for invalid upgrade type', () => {
            const upgrades = new UpgradesComponent();

            expect(upgrades.getUpgradeLevel('INVALID' as UpgradeType)).toBe(0);
        });

        it('should track levels independently', () => {
            const upgrades = new UpgradesComponent();

            upgrades.upgrade(UpgradeType.DAMAGE);
            upgrades.upgrade(UpgradeType.DAMAGE);
            upgrades.upgrade(UpgradeType.SPEED);

            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(2);
            expect(upgrades.getUpgradeLevel(UpgradeType.SPEED)).toBe(1);
            expect(upgrades.getUpgradeLevel(UpgradeType.HEALTH)).toBe(0);
        });
    });

    describe('getTotalUpgradeLevels()', () => {
        it('should return 0 when no upgrades', () => {
            const upgrades = new UpgradesComponent();

            expect(upgrades.getTotalUpgradeLevels()).toBe(0);
        });

        it('should sum all upgrade levels', () => {
            const upgrades = new UpgradesComponent();

            upgrades.upgrade(UpgradeType.DAMAGE);
            upgrades.upgrade(UpgradeType.DAMAGE);
            upgrades.upgrade(UpgradeType.SPEED);
            upgrades.upgrade(UpgradeType.HEALTH);

            expect(upgrades.getTotalUpgradeLevels()).toBe(4);
        });

        it('should count maxed out upgrades', () => {
            const upgrades = new UpgradesComponent();

            // Max out rotation speed (3 levels)
            upgrades.upgrade(UpgradeType.ROTATION_SPEED);
            upgrades.upgrade(UpgradeType.ROTATION_SPEED);
            upgrades.upgrade(UpgradeType.ROTATION_SPEED);

            expect(upgrades.getTotalUpgradeLevels()).toBe(3);
        });

        it('should track total across multiple upgrade types', () => {
            const upgrades = new UpgradesComponent();

            // Upgrade everything once
            upgrades.upgrade(UpgradeType.FIRE_RATE);
            upgrades.upgrade(UpgradeType.DAMAGE);
            upgrades.upgrade(UpgradeType.SPEED);
            upgrades.upgrade(UpgradeType.HEALTH);
            upgrades.upgrade(UpgradeType.MAX_AMMO);
            upgrades.upgrade(UpgradeType.ROTATION_SPEED);

            expect(upgrades.getTotalUpgradeLevels()).toBe(6);
        });
    });

    describe('Max Level Limits', () => {
        it('should respect fire rate max level of 5', () => {
            const upgrades = new UpgradesComponent();

            for (let i = 0; i < 10; i++) {
                upgrades.upgrade(UpgradeType.FIRE_RATE);
            }

            expect(upgrades.getUpgradeLevel(UpgradeType.FIRE_RATE)).toBe(5);
        });

        it('should respect damage max level of 10', () => {
            const upgrades = new UpgradesComponent();

            for (let i = 0; i < 15; i++) {
                upgrades.upgrade(UpgradeType.DAMAGE);
            }

            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(10);
        });

        it('should respect speed max level of 5', () => {
            const upgrades = new UpgradesComponent();

            for (let i = 0; i < 10; i++) {
                upgrades.upgrade(UpgradeType.SPEED);
            }

            expect(upgrades.getUpgradeLevel(UpgradeType.SPEED)).toBe(5);
        });

        it('should respect health max level of 5', () => {
            const upgrades = new UpgradesComponent();

            for (let i = 0; i < 10; i++) {
                upgrades.upgrade(UpgradeType.HEALTH);
            }

            expect(upgrades.getUpgradeLevel(UpgradeType.HEALTH)).toBe(5);
        });

        it('should respect max ammo max level of 10', () => {
            const upgrades = new UpgradesComponent();

            for (let i = 0; i < 15; i++) {
                upgrades.upgrade(UpgradeType.MAX_AMMO);
            }

            expect(upgrades.getUpgradeLevel(UpgradeType.MAX_AMMO)).toBe(10);
        });

        it('should respect rotation speed max level of 3', () => {
            const upgrades = new UpgradesComponent();

            for (let i = 0; i < 10; i++) {
                upgrades.upgrade(UpgradeType.ROTATION_SPEED);
            }

            expect(upgrades.getUpgradeLevel(UpgradeType.ROTATION_SPEED)).toBe(3);
        });
    });

    describe('Edge Cases', () => {
        it('should handle upgrading to exactly max level', () => {
            const upgrades = new UpgradesComponent();

            // Upgrade to exactly level 3 (max for rotation speed)
            upgrades.upgrade(UpgradeType.ROTATION_SPEED);
            upgrades.upgrade(UpgradeType.ROTATION_SPEED);
            const success = upgrades.upgrade(UpgradeType.ROTATION_SPEED);

            expect(success).toBe(true);
            expect(upgrades.getUpgradeLevel(UpgradeType.ROTATION_SPEED)).toBe(3);
            expect(upgrades.canUpgrade(UpgradeType.ROTATION_SPEED)).toBe(false);
        });

        it('should handle all upgrades at max level', () => {
            const upgrades = new UpgradesComponent();

            // Max out everything
            for (let i = 0; i < 5; i++) upgrades.upgrade(UpgradeType.FIRE_RATE);
            for (let i = 0; i < 10; i++) upgrades.upgrade(UpgradeType.DAMAGE);
            for (let i = 0; i < 5; i++) upgrades.upgrade(UpgradeType.SPEED);
            for (let i = 0; i < 5; i++) upgrades.upgrade(UpgradeType.HEALTH);
            for (let i = 0; i < 10; i++) upgrades.upgrade(UpgradeType.MAX_AMMO);
            for (let i = 0; i < 3; i++) upgrades.upgrade(UpgradeType.ROTATION_SPEED);

            // Total: 5 + 10 + 5 + 5 + 10 + 3 = 38
            expect(upgrades.getTotalUpgradeLevels()).toBe(38);

            // All should be at max
            expect(upgrades.canUpgrade(UpgradeType.FIRE_RATE)).toBe(false);
            expect(upgrades.canUpgrade(UpgradeType.DAMAGE)).toBe(false);
            expect(upgrades.canUpgrade(UpgradeType.SPEED)).toBe(false);
            expect(upgrades.canUpgrade(UpgradeType.HEALTH)).toBe(false);
            expect(upgrades.canUpgrade(UpgradeType.MAX_AMMO)).toBe(false);
            expect(upgrades.canUpgrade(UpgradeType.ROTATION_SPEED)).toBe(false);
        });
    });

    describe('Upgrade Patterns', () => {
        it('should handle balanced upgrade pattern', () => {
            const upgrades = new UpgradesComponent();

            // Upgrade each type once
            upgrades.upgrade(UpgradeType.FIRE_RATE);
            upgrades.upgrade(UpgradeType.DAMAGE);
            upgrades.upgrade(UpgradeType.SPEED);
            upgrades.upgrade(UpgradeType.HEALTH);
            upgrades.upgrade(UpgradeType.MAX_AMMO);
            upgrades.upgrade(UpgradeType.ROTATION_SPEED);

            expect(upgrades.getUpgradeLevel(UpgradeType.FIRE_RATE)).toBe(1);
            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(1);
            expect(upgrades.getUpgradeLevel(UpgradeType.SPEED)).toBe(1);
            expect(upgrades.getUpgradeLevel(UpgradeType.HEALTH)).toBe(1);
            expect(upgrades.getUpgradeLevel(UpgradeType.MAX_AMMO)).toBe(1);
            expect(upgrades.getUpgradeLevel(UpgradeType.ROTATION_SPEED)).toBe(1);
            expect(upgrades.getTotalUpgradeLevels()).toBe(6);
        });

        it('should handle focused upgrade pattern', () => {
            const upgrades = new UpgradesComponent();

            // Focus on damage only
            for (let i = 0; i < 10; i++) {
                upgrades.upgrade(UpgradeType.DAMAGE);
            }

            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(10);
            expect(upgrades.getTotalUpgradeLevels()).toBe(10);

            // Other upgrades should still be available
            expect(upgrades.canUpgrade(UpgradeType.SPEED)).toBe(true);
            expect(upgrades.canUpgrade(UpgradeType.HEALTH)).toBe(true);
        });

        it('should handle mixed upgrade pattern', () => {
            const upgrades = new UpgradesComponent();

            // Realistic gameplay pattern
            upgrades.upgrade(UpgradeType.DAMAGE); // 1
            upgrades.upgrade(UpgradeType.DAMAGE); // 2
            upgrades.upgrade(UpgradeType.SPEED); // 1
            upgrades.upgrade(UpgradeType.FIRE_RATE); // 1
            upgrades.upgrade(UpgradeType.DAMAGE); // 3
            upgrades.upgrade(UpgradeType.HEALTH); // 1
            upgrades.upgrade(UpgradeType.MAX_AMMO); // 1
            upgrades.upgrade(UpgradeType.SPEED); // 2

            expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(3);
            expect(upgrades.getUpgradeLevel(UpgradeType.SPEED)).toBe(2);
            expect(upgrades.getUpgradeLevel(UpgradeType.FIRE_RATE)).toBe(1);
            expect(upgrades.getUpgradeLevel(UpgradeType.HEALTH)).toBe(1);
            expect(upgrades.getUpgradeLevel(UpgradeType.MAX_AMMO)).toBe(1);
            expect(upgrades.getUpgradeLevel(UpgradeType.ROTATION_SPEED)).toBe(0);
            expect(upgrades.getTotalUpgradeLevels()).toBe(8);
        });
    });

    describe('Upgrade Values', () => {
        it('should maintain correct value per level across upgrades', () => {
            const upgrades = new UpgradesComponent();

            upgrades.upgrade(UpgradeType.DAMAGE);
            const upgrade1 = upgrades.getUpgrade(UpgradeType.DAMAGE);
            expect(upgrade1?.valuePerLevel).toBe(1);

            upgrades.upgrade(UpgradeType.DAMAGE);
            const upgrade2 = upgrades.getUpgrade(UpgradeType.DAMAGE);
            expect(upgrade2?.valuePerLevel).toBe(1); // Should not change
        });

        it('should have percentage-based values for rate upgrades', () => {
            const upgrades = new UpgradesComponent();

            const fireRate = upgrades.getUpgrade(UpgradeType.FIRE_RATE);
            const speed = upgrades.getUpgrade(UpgradeType.SPEED);
            const rotation = upgrades.getUpgrade(UpgradeType.ROTATION_SPEED);

            // These should be percentages (decimals)
            expect(fireRate?.valuePerLevel).toBeLessThan(1);
            expect(speed?.valuePerLevel).toBeLessThan(1);
            expect(rotation?.valuePerLevel).toBeLessThan(1);
        });

        it('should have flat values for capacity upgrades', () => {
            const upgrades = new UpgradesComponent();

            const damage = upgrades.getUpgrade(UpgradeType.DAMAGE);
            const health = upgrades.getUpgrade(UpgradeType.HEALTH);
            const maxAmmo = upgrades.getUpgrade(UpgradeType.MAX_AMMO);

            // These should be flat values (>= 1)
            expect(damage?.valuePerLevel).toBeGreaterThanOrEqual(1);
            expect(health?.valuePerLevel).toBeGreaterThanOrEqual(1);
            expect(maxAmmo?.valuePerLevel).toBeGreaterThanOrEqual(1);
        });
    });
});
