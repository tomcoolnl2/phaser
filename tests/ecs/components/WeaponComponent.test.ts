import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';

describe('WeaponComponent', () => {
    let mockBulletGroup: any;

    beforeEach(() => {
        mockBulletGroup = {
            get: vi.fn(),
            create: vi.fn(),
        };
    });

    describe('Initialization', () => {
        it('should initialize with provided values', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 250, 400, 2, 'laser-level-1');

            expect(weapon.bullets).toBe(mockBulletGroup);
            expect(weapon.ammo).toBe(50);
            expect(weapon.maxAmmo).toBe(100);
            expect(weapon.fireRate).toBe(250);
            expect(weapon.bulletSpeed).toBe(400);
            expect(weapon.damage).toBe(2);
            expect(weapon.bulletSpriteKey).toBe('laser-level-1');
            expect(weapon.triggerPulled).toBe(false);
            expect(weapon.lastFired).toBe(0);
        });

        it('should use default values when not specified', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50);

            expect(weapon.maxAmmo).toBe(999);
            expect(weapon.fireRate).toBe(250);
            expect(weapon.bulletSpeed).toBe(400);
            expect(weapon.damage).toBe(1);
            expect(weapon.bulletSpriteKey).toBe('laser-level-1');
        });

        it('should initialize with zero ammo', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 0, 100);

            expect(weapon.ammo).toBe(0);
        });
    });

    describe('canFire()', () => {
        it('should return true when ammo available and cooldown elapsed', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 100);
            weapon.lastFired = Date.now() - 150; // 150ms ago

            expect(weapon.canFire()).toBe(true);
        });

        it('should return false when no ammo', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 0, 100, 100);
            weapon.lastFired = Date.now() - 150;

            expect(weapon.canFire()).toBe(false);
        });

        it('should return false when cooldown not elapsed', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 100);
            weapon.lastFired = Date.now() - 50; // Only 50ms ago, need 100ms

            expect(weapon.canFire()).toBe(false);
        });

        it('should return false when no ammo and cooldown not elapsed', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 0, 100, 100);
            weapon.lastFired = Date.now() - 50;

            expect(weapon.canFire()).toBe(false);
        });

        it('should return true at exactly fire rate cooldown', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 100);
            weapon.lastFired = Date.now() - 100; // Exactly 100ms ago

            expect(weapon.canFire()).toBe(true);
        });

        it('should return true on first shot (lastFired = 0)', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 100);
            // lastFired is 0 by default

            expect(weapon.canFire()).toBe(true);
        });
    });

    describe('fire()', () => {
        it('should consume one ammo', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100);

            weapon.fire();

            expect(weapon.ammo).toBe(49);
        });

        it('should update lastFired timestamp', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100);
            const before = Date.now();

            weapon.fire();

            expect(weapon.lastFired).toBeGreaterThanOrEqual(before);
            expect(weapon.lastFired).toBeLessThanOrEqual(Date.now());
        });

        it('should not reduce ammo below 0', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 1, 100);

            weapon.fire();
            expect(weapon.ammo).toBe(0);

            weapon.fire();
            expect(weapon.ammo).toBe(0);
        });

        it('should handle firing with 0 ammo', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 0, 100);

            weapon.fire();

            expect(weapon.ammo).toBe(0);
        });

        it('should allow multiple shots', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 10, 100);

            weapon.fire();
            expect(weapon.ammo).toBe(9);

            weapon.fire();
            expect(weapon.ammo).toBe(8);

            weapon.fire();
            expect(weapon.ammo).toBe(7);
        });
    });

    describe('addAmmo()', () => {
        it('should add ammo', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100);

            weapon.addAmmo(10);

            expect(weapon.ammo).toBe(60);
        });

        it('should not exceed max ammo', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 90, 100);

            weapon.addAmmo(20);

            expect(weapon.ammo).toBe(100);
        });

        it('should add to zero ammo', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 0, 100);

            weapon.addAmmo(25);

            expect(weapon.ammo).toBe(25);
        });

        it('should handle adding zero ammo', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100);

            weapon.addAmmo(0);

            expect(weapon.ammo).toBe(50);
        });

        it('should handle negative ammo (removes)', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100);

            weapon.addAmmo(-10);

            expect(weapon.ammo).toBe(40);
        });

        it('should cap at max ammo with multiple additions', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 80, 100);

            weapon.addAmmo(10);
            expect(weapon.ammo).toBe(90);

            weapon.addAmmo(20); // Should cap at 100
            expect(weapon.ammo).toBe(100);
        });

        it('should fill to exactly max ammo', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100);

            weapon.addAmmo(50);

            expect(weapon.ammo).toBe(100);
        });
    });

    describe('upgradeFireRate()', () => {
        it('should reduce fire rate by percentage', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500);

            weapon.upgradeFireRate(0.1); // 10% faster

            expect(weapon.fireRate).toBe(450); // 500 * 0.9
        });

        it('should not reduce fire rate below 50ms', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 100);

            weapon.upgradeFireRate(0.9); // 90% faster (would be 10ms)

            expect(weapon.fireRate).toBe(50); // Capped at 50
        });

        it('should handle multiple upgrades', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500);

            weapon.upgradeFireRate(0.1); // 500 * 0.9 = 450
            expect(weapon.fireRate).toBe(450);

            weapon.upgradeFireRate(0.1); // 450 * 0.9 = 405
            expect(weapon.fireRate).toBe(405);

            weapon.upgradeFireRate(0.1); // 405 * 0.9 = 364.5
            expect(weapon.fireRate).toBeCloseTo(364.5, 1);
        });

        it('should handle zero upgrade', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500);

            weapon.upgradeFireRate(0);

            expect(weapon.fireRate).toBe(500);
        });

        it('should handle negative upgrade (makes slower)', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500);

            weapon.upgradeFireRate(-0.1); // -10% = 10% slower

            expect(weapon.fireRate).toBe(550); // 500 * 1.1
        });

        it('should reach minimum fire rate', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 100);

            // Upgrade until we hit the cap
            for (let i = 0; i < 10; i++) {
                weapon.upgradeFireRate(0.2);
            }

            expect(weapon.fireRate).toBe(50); // Minimum
        });
    });

    describe('upgradeDamage()', () => {
        it('should increase damage', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 250, 400, 1);

            weapon.upgradeDamage(1);

            expect(weapon.damage).toBe(2);
        });

        it('should stack damage upgrades', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 250, 400, 1);

            weapon.upgradeDamage(1);
            expect(weapon.damage).toBe(2);

            weapon.upgradeDamage(2);
            expect(weapon.damage).toBe(4);

            weapon.upgradeDamage(3);
            expect(weapon.damage).toBe(7);
        });

        it('should handle zero damage increase', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 250, 400, 5);

            weapon.upgradeDamage(0);

            expect(weapon.damage).toBe(5);
        });

        it('should handle negative damage increase (reduces)', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 250, 400, 10);

            weapon.upgradeDamage(-3);

            expect(weapon.damage).toBe(7);
        });

        it('should handle decimal damage increases', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 250, 400, 1);

            weapon.upgradeDamage(0.5);

            expect(weapon.damage).toBe(1.5);
        });

        it('should allow very large damage', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 250, 400, 1);

            weapon.upgradeDamage(999);

            expect(weapon.damage).toBe(1000);
        });
    });

    describe('Trigger State', () => {
        it('should start with trigger not pulled', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100);

            expect(weapon.triggerPulled).toBe(false);
        });

        it('should allow trigger state to be set', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100);

            weapon.triggerPulled = true;
            expect(weapon.triggerPulled).toBe(true);

            weapon.triggerPulled = false;
            expect(weapon.triggerPulled).toBe(false);
        });
    });

    describe('Bullet Sprite Key', () => {
        it('should allow changing bullet sprite', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100);

            weapon.bulletSpriteKey = 'laser-level-2';

            expect(weapon.bulletSpriteKey).toBe('laser-level-2');
        });

        it('should maintain sprite key through upgrades', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 250, 400, 1, 'custom-bullet');

            weapon.upgradeDamage(5);
            weapon.upgradeFireRate(0.1);

            expect(weapon.bulletSpriteKey).toBe('custom-bullet');
        });
    });

    describe('Edge Cases', () => {
        it('should handle very large ammo capacity', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 10000, 99999);

            weapon.addAmmo(5000);

            expect(weapon.ammo).toBe(15000);
        });

        it('should handle very fast fire rate', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 10);

            weapon.upgradeFireRate(0.5); // Would be 5ms, but capped at 50

            expect(weapon.fireRate).toBe(50);
        });

        it('should handle fractional fire rates', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 333);

            weapon.upgradeFireRate(0.1);

            expect(weapon.fireRate).toBeCloseTo(299.7, 1);
        });
    });

    describe('Gameplay Scenarios', () => {
        it('should simulate rapid firing until out of ammo', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 5, 100, 0); // No cooldown for test

            for (let i = 5; i > 0; i--) {
                expect(weapon.canFire()).toBe(true);
                weapon.fire();
            }

            expect(weapon.ammo).toBe(0);
            expect(weapon.canFire()).toBe(false);
        });

        it('should simulate ammo pickup during combat', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 10, 100, 0);

            // Fire some shots
            weapon.fire();
            weapon.fire();
            weapon.fire();
            expect(weapon.ammo).toBe(7);

            // Pickup ammo
            weapon.addAmmo(20);
            expect(weapon.ammo).toBe(27);

            // Continue firing
            weapon.fire();
            weapon.fire();
            expect(weapon.ammo).toBe(25);
        });

        it('should simulate progressive upgrades', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 50, 100, 500, 400, 1);

            // Level 1 stats
            expect(weapon.damage).toBe(1);
            expect(weapon.fireRate).toBe(500);

            // Upgrade to level 2
            weapon.upgradeDamage(1);
            weapon.upgradeFireRate(0.1);
            expect(weapon.damage).toBe(2);
            expect(weapon.fireRate).toBe(450);

            // Upgrade to level 3
            weapon.upgradeDamage(1);
            weapon.upgradeFireRate(0.1);
            expect(weapon.damage).toBe(3);
            expect(weapon.fireRate).toBe(405);
        });

        it('should handle fire rate cooldown correctly', () => {
            const weapon = new WeaponComponent(mockBulletGroup, 10, 100, 100);

            // First shot should be allowed
            expect(weapon.canFire()).toBe(true);
            weapon.fire();
            expect(weapon.ammo).toBe(9);

            // Immediate second shot should be blocked
            expect(weapon.canFire()).toBe(false);

            // Wait for cooldown
            weapon.lastFired = Date.now() - 100;

            // Now should be allowed
            expect(weapon.canFire()).toBe(true);
            weapon.fire();
            expect(weapon.ammo).toBe(8);
        });
    });
});
