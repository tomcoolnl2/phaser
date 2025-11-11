import { describe, it, expect } from 'vitest';
import { HealthComponent } from '@/ecs/components';

describe('HealthComponent', () => {
    describe('Initialization', () => {
        it('should initialize with max health as current health', () => {
            const health = new HealthComponent(100);

            expect(health.maxHealth).toBe(100);
            expect(health.currentHealth).toBe(100);
            expect(health.invulnerable).toBe(false);
        });

        it('should support different max health values', () => {
            const health1 = new HealthComponent(50);
            const health2 = new HealthComponent(200);
            const health3 = new HealthComponent(1);

            expect(health1.maxHealth).toBe(50);
            expect(health2.maxHealth).toBe(200);
            expect(health3.maxHealth).toBe(1);
        });
    });

    describe('takeDamage()', () => {
        it('should reduce current health by damage amount', () => {
            const health = new HealthComponent(100);

            const died = health.takeDamage(30);

            expect(health.currentHealth).toBe(70);
            expect(died).toBe(false);
        });

        it('should return true when damage kills entity', () => {
            const health = new HealthComponent(100);

            const died = health.takeDamage(100);

            expect(health.currentHealth).toBe(0);
            expect(died).toBe(true);
        });

        it('should return true when overkill damage is applied', () => {
            const health = new HealthComponent(100);

            const died = health.takeDamage(150);

            expect(health.currentHealth).toBe(0);
            expect(died).toBe(true);
        });

        it('should not reduce health below 0', () => {
            const health = new HealthComponent(100);

            health.takeDamage(250);

            expect(health.currentHealth).toBe(0);
        });

        it('should not take damage when invulnerable', () => {
            const health = new HealthComponent(100);
            health.invulnerable = true;

            const died = health.takeDamage(50);

            expect(health.currentHealth).toBe(100);
            expect(died).toBe(false);
        });

        it('should handle zero damage', () => {
            const health = new HealthComponent(100);

            const died = health.takeDamage(0);

            expect(health.currentHealth).toBe(100);
            expect(died).toBe(false);
        });

        it('should handle negative damage (heals)', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 50;

            health.takeDamage(-10);

            expect(health.currentHealth).toBe(60);
        });

        it('should allow multiple damage applications', () => {
            const health = new HealthComponent(100);

            health.takeDamage(20);
            expect(health.currentHealth).toBe(80);

            health.takeDamage(30);
            expect(health.currentHealth).toBe(50);

            health.takeDamage(10);
            expect(health.currentHealth).toBe(40);
        });

        it('should track when entity dies from multiple hits', () => {
            const health = new HealthComponent(100);

            const died1 = health.takeDamage(60);
            expect(died1).toBe(false);
            expect(health.currentHealth).toBe(40);

            const died2 = health.takeDamage(40);
            expect(died2).toBe(true);
            expect(health.currentHealth).toBe(0);
        });
    });

    describe('heal()', () => {
        it('should restore health', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 50;

            health.heal(25);

            expect(health.currentHealth).toBe(75);
        });

        it('should not heal beyond max health', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 80;

            health.heal(50);

            expect(health.currentHealth).toBe(100);
        });

        it('should heal from 0 health', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 0;

            health.heal(30);

            expect(health.currentHealth).toBe(30);
        });

        it('should handle zero healing', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 50;

            health.heal(0);

            expect(health.currentHealth).toBe(50);
        });

        it('should handle negative healing (damages)', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 50;

            health.heal(-10);

            expect(health.currentHealth).toBe(40);
        });

        it('should allow multiple heals', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 20;

            health.heal(10);
            expect(health.currentHealth).toBe(30);

            health.heal(20);
            expect(health.currentHealth).toBe(50);

            health.heal(15);
            expect(health.currentHealth).toBe(65);
        });

        it('should cap at max health with multiple heals', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 90;

            health.heal(5);
            expect(health.currentHealth).toBe(95);

            health.heal(10); // Should cap at 100
            expect(health.currentHealth).toBe(100);
        });
    });

    describe('isDead()', () => {
        it('should return false when health is above 0', () => {
            const health = new HealthComponent(100);

            expect(health.isDead()).toBe(false);
        });

        it('should return true when health is 0', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 0;

            expect(health.isDead()).toBe(true);
        });

        it('should return true when health is below 0', () => {
            const health = new HealthComponent(100);
            health.currentHealth = -10;

            expect(health.isDead()).toBe(true);
        });

        it('should return false when at 1 health', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 1;

            expect(health.isDead()).toBe(false);
        });

        it('should reflect state after damage', () => {
            const health = new HealthComponent(50);

            expect(health.isDead()).toBe(false);

            health.takeDamage(50);
            expect(health.isDead()).toBe(true);
        });

        it('should reflect state after healing from death', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 0;

            expect(health.isDead()).toBe(true);

            health.heal(10);
            expect(health.isDead()).toBe(false);
        });
    });

    describe('getHealthPercentage()', () => {
        it('should return 1.0 at full health', () => {
            const health = new HealthComponent(100);

            expect(health.getHealthPercentage()).toBe(1.0);
        });

        it('should return 0.0 at zero health', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 0;

            expect(health.getHealthPercentage()).toBe(0.0);
        });

        it('should return 0.5 at half health', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 50;

            expect(health.getHealthPercentage()).toBe(0.5);
        });

        it('should calculate percentage correctly for various values', () => {
            const health = new HealthComponent(100);

            health.currentHealth = 25;
            expect(health.getHealthPercentage()).toBe(0.25);

            health.currentHealth = 75;
            expect(health.getHealthPercentage()).toBe(0.75);

            health.currentHealth = 1;
            expect(health.getHealthPercentage()).toBe(0.01);

            health.currentHealth = 99;
            expect(health.getHealthPercentage()).toBe(0.99);
        });

        it('should work with non-100 max health', () => {
            const health = new HealthComponent(200);
            health.currentHealth = 100;

            expect(health.getHealthPercentage()).toBe(0.5);
        });

        it('should handle fractional health', () => {
            const health = new HealthComponent(3);
            health.currentHealth = 1;

            expect(health.getHealthPercentage()).toBeCloseTo(0.333, 2);
        });
    });

    describe('Invulnerability', () => {
        it('should start as vulnerable', () => {
            const health = new HealthComponent(100);

            expect(health.invulnerable).toBe(false);
        });

        it('should allow toggling invulnerability', () => {
            const health = new HealthComponent(100);

            health.invulnerable = true;
            expect(health.invulnerable).toBe(true);

            health.invulnerable = false;
            expect(health.invulnerable).toBe(false);
        });

        it('should block all damage while invulnerable', () => {
            const health = new HealthComponent(100);
            health.invulnerable = true;

            health.takeDamage(50);
            expect(health.currentHealth).toBe(100);

            health.takeDamage(100);
            expect(health.currentHealth).toBe(100);

            health.takeDamage(1);
            expect(health.currentHealth).toBe(100);
        });

        it('should allow damage after disabling invulnerability', () => {
            const health = new HealthComponent(100);
            health.invulnerable = true;

            health.takeDamage(50);
            expect(health.currentHealth).toBe(100);

            health.invulnerable = false;

            health.takeDamage(30);
            expect(health.currentHealth).toBe(70);
        });

        it('should not affect healing', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 50;
            health.invulnerable = true;

            health.heal(20);

            expect(health.currentHealth).toBe(70);
        });
    });

    describe('Edge Cases', () => {
        it('should handle very large max health', () => {
            const health = new HealthComponent(999999);

            expect(health.currentHealth).toBe(999999);
            expect(health.isDead()).toBe(false);
        });

        it('should handle max health of 1', () => {
            const health = new HealthComponent(1);

            expect(health.currentHealth).toBe(1);

            health.takeDamage(1);
            expect(health.isDead()).toBe(true);
        });

        it('should handle decimal damage', () => {
            const health = new HealthComponent(100);

            health.takeDamage(10.5);
            expect(health.currentHealth).toBe(89.5);

            health.takeDamage(0.5);
            expect(health.currentHealth).toBe(89);
        });

        it('should handle decimal healing', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 50;

            health.heal(10.7);
            expect(health.currentHealth).toBeCloseTo(60.7, 1);
        });

        it('should survive at exactly 0.1 health', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 0.1;

            expect(health.isDead()).toBe(false);
        });
    });

    describe('Combat Scenarios', () => {
        it('should simulate a typical combat encounter', () => {
            const health = new HealthComponent(100);

            // Take damage
            health.takeDamage(30);
            expect(health.currentHealth).toBe(70);

            // Heal
            health.heal(20);
            expect(health.currentHealth).toBe(90);

            // Take more damage
            health.takeDamage(40);
            expect(health.currentHealth).toBe(50);
            expect(health.getHealthPercentage()).toBe(0.5);

            // Finish off
            const died = health.takeDamage(50);
            expect(died).toBe(true);
            expect(health.isDead()).toBe(true);
        });

        it('should handle damage over time', () => {
            const health = new HealthComponent(100);

            // Simulate 10 damage per tick for 8 ticks
            for (let i = 0; i < 8; i++) {
                const died = health.takeDamage(10);
                expect(died).toBe(false);
            }

            expect(health.currentHealth).toBe(20);

            // Next two ticks should kill
            const died1 = health.takeDamage(10);
            expect(died1).toBe(false);
            expect(health.currentHealth).toBe(10);

            const died2 = health.takeDamage(10);
            expect(died2).toBe(true);
            expect(health.currentHealth).toBe(0);
        });

        it('should handle regeneration', () => {
            const health = new HealthComponent(100);
            health.currentHealth = 10;

            // Simulate regeneration
            for (let i = 0; i < 9; i++) {
                health.heal(10);
            }

            expect(health.currentHealth).toBe(100);

            // Extra regen shouldn't exceed max
            health.heal(10);
            expect(health.currentHealth).toBe(100);
        });
    });
});
