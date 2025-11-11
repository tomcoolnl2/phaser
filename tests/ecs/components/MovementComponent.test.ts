import { describe, it, expect, beforeEach } from 'vitest';
import { MovementComponent } from '@/ecs/components';

describe('MovementComponent', () => {
    describe('constructor', () => {
        it('should initialize with provided parameters', () => {
            const movement = new MovementComponent(200, 500, 0.97, 0.03);

            expect(movement.maxVelocity).toBe(200);
            expect(movement.acceleration).toBe(500);
            expect(movement.drag).toBe(0.97);
            expect(movement.rotationSpeed).toBe(0.03);
        });

        it('should initialize with default values for optional properties', () => {
            const movement = new MovementComponent(150, 400, 0.95, 0.02);

            expect(movement.canMove).toBe(true);
            expect(movement.rotationInput).toBe(0);
            expect(movement.thrustInput).toBe(0);
            expect(movement.brakeInput).toBe(false);
            expect(movement.targetRotation).toBe(0);
        });

        it('should accept zero values for parameters', () => {
            const movement = new MovementComponent(0, 0, 0, 0);

            expect(movement.maxVelocity).toBe(0);
            expect(movement.acceleration).toBe(0);
            expect(movement.drag).toBe(0);
            expect(movement.rotationSpeed).toBe(0);
        });

        it('should accept very high values', () => {
            const movement = new MovementComponent(10000, 5000, 0.999, 1);

            expect(movement.maxVelocity).toBe(10000);
            expect(movement.acceleration).toBe(5000);
            expect(movement.drag).toBe(0.999);
            expect(movement.rotationSpeed).toBe(1);
        });
    });

    describe('upgradeSpeed', () => {
        let movement: MovementComponent;

        beforeEach(() => {
            movement = new MovementComponent(200, 500, 0.97, 0.03);
        });

        it('should increase maxVelocity by the given percentage', () => {
            movement.upgradeSpeed(0.1); // 10% increase

            expect(movement.maxVelocity).toBeCloseTo(220, 1); // 200 * 1.1
        });

        it('should increase acceleration by the given percentage', () => {
            movement.upgradeSpeed(0.1); // 10% increase

            expect(movement.acceleration).toBe(550); // 500 * 1.1
        });

        it('should increase both maxVelocity and acceleration by the same percentage', () => {
            movement.upgradeSpeed(0.2); // 20% increase

            expect(movement.maxVelocity).toBe(240); // 200 * 1.2
            expect(movement.acceleration).toBe(600); // 500 * 1.2
        });

        it('should handle small percentage increases', () => {
            movement.upgradeSpeed(0.01); // 1% increase

            expect(movement.maxVelocity).toBeCloseTo(202, 1); // 200 * 1.01
            expect(movement.acceleration).toBeCloseTo(505, 1); // 500 * 1.01
        });

        it('should handle large percentage increases', () => {
            movement.upgradeSpeed(1.0); // 100% increase (double)

            expect(movement.maxVelocity).toBe(400); // 200 * 2
            expect(movement.acceleration).toBe(1000); // 500 * 2
        });

        it('should compound with multiple upgrades', () => {
            movement.upgradeSpeed(0.1); // 10% increase
            movement.upgradeSpeed(0.1); // another 10% increase

            // 200 * 1.1 * 1.1 = 242
            expect(movement.maxVelocity).toBeCloseTo(242, 1);
            // 500 * 1.1 * 1.1 = 605
            expect(movement.acceleration).toBeCloseTo(605, 1);
        });

        it('should handle zero percentage (no change)', () => {
            const originalMax = movement.maxVelocity;
            const originalAccel = movement.acceleration;

            movement.upgradeSpeed(0); // 0% increase

            expect(movement.maxVelocity).toBe(originalMax);
            expect(movement.acceleration).toBe(originalAccel);
        });

        it('should not affect drag', () => {
            const originalDrag = movement.drag;
            movement.upgradeSpeed(0.5);

            expect(movement.drag).toBe(originalDrag);
        });

        it('should not affect rotationSpeed', () => {
            const originalRotation = movement.rotationSpeed;
            movement.upgradeSpeed(0.5);

            expect(movement.rotationSpeed).toBe(originalRotation);
        });

        it('should handle decimal result correctly', () => {
            movement.maxVelocity = 100;
            movement.acceleration = 300;

            movement.upgradeSpeed(0.15); // 15% increase

            expect(movement.maxVelocity).toBeCloseTo(115, 1); // 100 * 1.15
            expect(movement.acceleration).toBeCloseTo(345, 1); // 300 * 1.15
        });

        it('should work from very low base values', () => {
            movement.maxVelocity = 1;
            movement.acceleration = 1;

            movement.upgradeSpeed(0.5); // 50% increase

            expect(movement.maxVelocity).toBe(1.5);
            expect(movement.acceleration).toBe(1.5);
        });

        it('should work from very high base values', () => {
            movement.maxVelocity = 10000;
            movement.acceleration = 20000;

            movement.upgradeSpeed(0.1); // 10% increase

            expect(movement.maxVelocity).toBe(11000);
            expect(movement.acceleration).toBe(22000);
        });
    });

    describe('upgradeRotation', () => {
        let movement: MovementComponent;

        beforeEach(() => {
            movement = new MovementComponent(200, 500, 0.97, 0.03);
        });

        it('should increase rotationSpeed by the given percentage', () => {
            movement.upgradeRotation(0.1); // 10% increase

            expect(movement.rotationSpeed).toBeCloseTo(0.033, 4); // 0.03 * 1.1
        });

        it('should handle small percentage increases', () => {
            movement.upgradeRotation(0.05); // 5% increase

            expect(movement.rotationSpeed).toBeCloseTo(0.0315, 4); // 0.03 * 1.05
        });

        it('should handle large percentage increases', () => {
            movement.upgradeRotation(1.0); // 100% increase (double)

            expect(movement.rotationSpeed).toBeCloseTo(0.06, 4); // 0.03 * 2
        });

        it('should compound with multiple upgrades', () => {
            movement.upgradeRotation(0.2); // 20% increase
            movement.upgradeRotation(0.2); // another 20% increase

            // 0.03 * 1.2 * 1.2 = 0.0432
            expect(movement.rotationSpeed).toBeCloseTo(0.0432, 4);
        });

        it('should handle zero percentage (no change)', () => {
            const originalRotation = movement.rotationSpeed;

            movement.upgradeRotation(0); // 0% increase

            expect(movement.rotationSpeed).toBe(originalRotation);
        });

        it('should not affect maxVelocity', () => {
            const originalMax = movement.maxVelocity;
            movement.upgradeRotation(0.5);

            expect(movement.maxVelocity).toBe(originalMax);
        });

        it('should not affect acceleration', () => {
            const originalAccel = movement.acceleration;
            movement.upgradeRotation(0.5);

            expect(movement.acceleration).toBe(originalAccel);
        });

        it('should not affect drag', () => {
            const originalDrag = movement.drag;
            movement.upgradeRotation(0.5);

            expect(movement.drag).toBe(originalDrag);
        });

        it('should work with very small base values', () => {
            movement.rotationSpeed = 0.001;

            movement.upgradeRotation(0.5); // 50% increase

            expect(movement.rotationSpeed).toBeCloseTo(0.0015, 5);
        });

        it('should work with very large base values', () => {
            movement.rotationSpeed = 1.0;

            movement.upgradeRotation(0.1); // 10% increase

            expect(movement.rotationSpeed).toBeCloseTo(1.1, 4);
        });

        it('should handle multiple different upgrades', () => {
            movement.upgradeRotation(0.1); // 10% increase
            movement.upgradeRotation(0.2); // 20% increase
            movement.upgradeRotation(0.05); // 5% increase

            // 0.03 * 1.1 * 1.2 * 1.05 = 0.04158
            expect(movement.rotationSpeed).toBeCloseTo(0.04158, 4);
        });
    });

    describe('input state management', () => {
        let movement: MovementComponent;

        beforeEach(() => {
            movement = new MovementComponent(200, 500, 0.97, 0.03);
        });

        it('should allow setting rotationInput', () => {
            movement.rotationInput = -1;
            expect(movement.rotationInput).toBe(-1);

            movement.rotationInput = 1;
            expect(movement.rotationInput).toBe(1);

            movement.rotationInput = 0;
            expect(movement.rotationInput).toBe(0);
        });

        it('should allow setting thrustInput', () => {
            movement.thrustInput = 1;
            expect(movement.thrustInput).toBe(1);

            movement.thrustInput = 0;
            expect(movement.thrustInput).toBe(0);
        });

        it('should allow setting brakeInput', () => {
            movement.brakeInput = true;
            expect(movement.brakeInput).toBe(true);

            movement.brakeInput = false;
            expect(movement.brakeInput).toBe(false);
        });

        it('should allow setting targetRotation', () => {
            movement.targetRotation = Math.PI;
            expect(movement.targetRotation).toBe(Math.PI);

            movement.targetRotation = -Math.PI / 2;
            expect(movement.targetRotation).toBe(-Math.PI / 2);
        });

        it('should allow setting canMove', () => {
            movement.canMove = false;
            expect(movement.canMove).toBe(false);

            movement.canMove = true;
            expect(movement.canMove).toBe(true);
        });
    });

    describe('combined upgrades', () => {
        let movement: MovementComponent;

        beforeEach(() => {
            movement = new MovementComponent(200, 500, 0.97, 0.03);
        });

        it('should allow both speed and rotation upgrades independently', () => {
            movement.upgradeSpeed(0.2); // 20% speed increase
            movement.upgradeRotation(0.3); // 30% rotation increase

            expect(movement.maxVelocity).toBe(240); // 200 * 1.2
            expect(movement.acceleration).toBe(600); // 500 * 1.2
            expect(movement.rotationSpeed).toBeCloseTo(0.039, 4); // 0.03 * 1.3
        });

        it('should maintain separate upgrade multipliers', () => {
            // Upgrade speed twice
            movement.upgradeSpeed(0.1);
            movement.upgradeSpeed(0.1);

            // Upgrade rotation once
            movement.upgradeRotation(0.2);

            // Speed: 200 * 1.1 * 1.1 = 242
            expect(movement.maxVelocity).toBeCloseTo(242, 1);
            // Rotation: 0.03 * 1.2 = 0.036
            expect(movement.rotationSpeed).toBeCloseTo(0.036, 4);
        });

        it('should handle alternating upgrades correctly', () => {
            movement.upgradeSpeed(0.1);
            movement.upgradeRotation(0.1);
            movement.upgradeSpeed(0.1);
            movement.upgradeRotation(0.1);

            // Speed: 200 * 1.1 * 1.1 = 242
            expect(movement.maxVelocity).toBeCloseTo(242, 1);
            // Rotation: 0.03 * 1.1 * 1.1 = 0.0363
            expect(movement.rotationSpeed).toBeCloseTo(0.0363, 4);
        });
    });

    describe('edge cases', () => {
        it('should handle negative increase percentages (downgrades)', () => {
            const movement = new MovementComponent(200, 500, 0.97, 0.03);

            movement.upgradeSpeed(-0.1); // 10% decrease

            expect(movement.maxVelocity).toBeCloseTo(180, 1); // 200 * 0.9
            expect(movement.acceleration).toBeCloseTo(450, 1); // 500 * 0.9
        });

        it('should handle rotation downgrade', () => {
            const movement = new MovementComponent(200, 500, 0.97, 0.03);

            movement.upgradeRotation(-0.2); // 20% decrease

            expect(movement.rotationSpeed).toBeCloseTo(0.024, 4); // 0.03 * 0.8
        });

        it('should handle upgrading from zero base values', () => {
            const movement = new MovementComponent(0, 0, 0.97, 0);

            movement.upgradeSpeed(0.5);
            movement.upgradeRotation(0.5);

            expect(movement.maxVelocity).toBe(0); // 0 * 1.5 = 0
            expect(movement.acceleration).toBe(0); // 0 * 1.5 = 0
            expect(movement.rotationSpeed).toBe(0); // 0 * 1.5 = 0
        });

        it('should handle fractional rotationInput values', () => {
            const movement = new MovementComponent(200, 500, 0.97, 0.03);

            movement.rotationInput = 0.5;
            expect(movement.rotationInput).toBe(0.5);
        });

        it('should handle fractional thrustInput values', () => {
            const movement = new MovementComponent(200, 500, 0.97, 0.03);

            movement.thrustInput = 0.75;
            expect(movement.thrustInput).toBe(0.75);
        });
    });
});
