import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputSystem } from '@/ecs/systems';
import { EntityManager } from '@/ecs/core';
import { PlayerComponent, MovementComponent, WeaponComponent } from '@/ecs/components';

// Mock Phaser global
global.Phaser = {
    Input: {
        Keyboard: {
            KeyCodes: {
                SPACE: 32,
            },
        },
    },
} as any;

describe('InputSystem', () => {
    let mockScene: any;
    let entityManager: EntityManager;
    let inputSystem: InputSystem;
    let mockCursors: any;
    let mockFireKey: any;

    beforeEach(() => {
        // Mock cursor keys
        mockCursors = {
            left: { isDown: false },
            right: { isDown: false },
            up: { isDown: false },
            down: { isDown: false },
        };

        // Mock fire key
        mockFireKey = { isDown: false };

        // Mock Phaser scene with input
        mockScene = {
            input: {
                keyboard: {
                    createCursorKeys: vi.fn(() => mockCursors),
                    addKey: vi.fn(() => mockFireKey),
                },
            },
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
        inputSystem = new InputSystem(mockScene);
    });

    describe('Component Requirements', () => {
        it('should require PlayerComponent, MovementComponent, and WeaponComponent', () => {
            const required = inputSystem.getRequiredComponents();

            expect(required).toContain(PlayerComponent);
            expect(required).toContain(MovementComponent);
            expect(required).toContain(WeaponComponent);
            expect(required).toHaveLength(3);
        });
    });

    describe('Initialization', () => {
        it('should setup keyboard input on creation', () => {
            expect(mockScene.input.keyboard.createCursorKeys).toHaveBeenCalled();
            expect(mockScene.input.keyboard.addKey).toHaveBeenCalledWith(Phaser.Input.Keyboard.KeyCodes.SPACE);
        });

        it('should handle missing keyboard input gracefully', () => {
            const sceneWithoutKeyboard = {
                input: {},
            };

            expect(() => new InputSystem(sceneWithoutKeyboard as any)).not.toThrow();
        });
    });

    describe('Local Player Only', () => {
        it('should only process local player entities', () => {
            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'Player', false); // NOT local
            entity.addComponent(player);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            entity.addComponent(movement);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            // Set input
            mockCursors.left.isDown = true;

            // Update should not process remote player
            inputSystem.update(entity, 16);

            expect(movement.rotationInput).toBe(0); // Should not be affected
        });

        it('should process local player entities', () => {
            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'LocalPlayer', true); // IS local
            entity.addComponent(player);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            entity.addComponent(movement);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            // Set input
            mockCursors.left.isDown = true;

            inputSystem.update(entity, 16);

            expect(movement.rotationInput).toBe(-1); // Should be affected
        });
    });

    describe('Rotation Input', () => {
        let entity: any;
        let movement: MovementComponent;

        beforeEach(() => {
            entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'LocalPlayer', true);
            entity.addComponent(player);

            movement = new MovementComponent(200, 500, 0.97, 0.03);
            entity.addComponent(movement);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);
        });

        it('should set rotationInput to -1 when left arrow is pressed', () => {
            mockCursors.left.isDown = true;

            inputSystem.update(entity, 16);

            expect(movement.rotationInput).toBe(-1);
        });

        it('should set rotationInput to 1 when right arrow is pressed', () => {
            mockCursors.right.isDown = true;

            inputSystem.update(entity, 16);

            expect(movement.rotationInput).toBe(1);
        });

        it('should set rotationInput to 0 when no rotation keys pressed', () => {
            inputSystem.update(entity, 16);

            expect(movement.rotationInput).toBe(0);
        });

        it('should prioritize right when both left and right are pressed', () => {
            mockCursors.left.isDown = true;
            mockCursors.right.isDown = true;

            inputSystem.update(entity, 16);

            // Right is checked after left, so it wins
            expect(movement.rotationInput).toBe(1);
        });
    });

    describe('Thrust Input', () => {
        let entity: any;
        let movement: MovementComponent;

        beforeEach(() => {
            entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'LocalPlayer', true);
            entity.addComponent(player);

            movement = new MovementComponent(200, 500, 0.97, 0.03);
            entity.addComponent(movement);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);
        });

        it('should set thrustInput to 1 when up arrow is pressed', () => {
            mockCursors.up.isDown = true;

            inputSystem.update(entity, 16);

            expect(movement.thrustInput).toBe(1);
            expect(movement.brakeInput).toBe(false);
        });

        it('should set brakeInput to true when down arrow is pressed', () => {
            mockCursors.down.isDown = true;

            inputSystem.update(entity, 16);

            expect(movement.thrustInput).toBe(0);
            expect(movement.brakeInput).toBe(true);
        });

        it('should set both to default when no thrust keys pressed', () => {
            inputSystem.update(entity, 16);

            expect(movement.thrustInput).toBe(0);
            expect(movement.brakeInput).toBe(false);
        });

        it('should prioritize thrust when both up and down are pressed', () => {
            mockCursors.up.isDown = true;
            mockCursors.down.isDown = true;

            inputSystem.update(entity, 16);

            // Up is checked first, so thrust wins
            expect(movement.thrustInput).toBe(1);
            expect(movement.brakeInput).toBe(false);
        });
    });

    describe('Weapon Input', () => {
        let entity: any;
        let weapon: WeaponComponent;

        beforeEach(() => {
            entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'LocalPlayer', true);
            entity.addComponent(player);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            entity.addComponent(movement);

            const bulletGroup = mockScene.physics.add.group();
            weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);
        });

        it('should set triggerPulled to true when space is pressed', () => {
            mockFireKey.isDown = true;

            inputSystem.update(entity, 16);

            expect(weapon.triggerPulled).toBe(true);
        });

        it('should set triggerPulled to false when space is not pressed', () => {
            weapon.triggerPulled = true; // Start with trigger pulled

            mockFireKey.isDown = false;

            inputSystem.update(entity, 16);

            expect(weapon.triggerPulled).toBe(false);
        });
    });

    describe('Combined Input', () => {
        let entity: any;
        let movement: MovementComponent;
        let weapon: WeaponComponent;

        beforeEach(() => {
            entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'LocalPlayer', true);
            entity.addComponent(player);

            movement = new MovementComponent(200, 500, 0.97, 0.03);
            entity.addComponent(movement);

            const bulletGroup = mockScene.physics.add.group();
            weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);
        });

        it('should handle rotating and thrusting simultaneously', () => {
            mockCursors.left.isDown = true;
            mockCursors.up.isDown = true;

            inputSystem.update(entity, 16);

            expect(movement.rotationInput).toBe(-1);
            expect(movement.thrustInput).toBe(1);
        });

        it('should handle all inputs at once', () => {
            mockCursors.right.isDown = true;
            mockCursors.up.isDown = true;
            mockFireKey.isDown = true;

            inputSystem.update(entity, 16);

            expect(movement.rotationInput).toBe(1);
            expect(movement.thrustInput).toBe(1);
            expect(weapon.triggerPulled).toBe(true);
        });

        it('should reset all inputs when no keys pressed', () => {
            // First set everything
            mockCursors.left.isDown = true;
            mockCursors.up.isDown = true;
            mockFireKey.isDown = true;
            inputSystem.update(entity, 16);

            // Then release everything
            mockCursors.left.isDown = false;
            mockCursors.up.isDown = false;
            mockFireKey.isDown = false;
            inputSystem.update(entity, 16);

            expect(movement.rotationInput).toBe(0);
            expect(movement.thrustInput).toBe(0);
            expect(movement.brakeInput).toBe(false);
            expect(weapon.triggerPulled).toBe(false);
        });
    });

    describe('Missing Components', () => {
        it('should handle entity without MovementComponent', () => {
            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'LocalPlayer', true);
            entity.addComponent(player);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            mockCursors.left.isDown = true;

            // Should not throw
            expect(() => inputSystem.update(entity, 16)).not.toThrow();
        });

        it('should handle entity without WeaponComponent', () => {
            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'LocalPlayer', true);
            entity.addComponent(player);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            entity.addComponent(movement);

            mockFireKey.isDown = true;

            // Should not throw
            expect(() => inputSystem.update(entity, 16)).not.toThrow();
        });
    });

    describe('Integration with EntityManager', () => {
        it('should work when added to EntityManager', () => {
            entityManager.addSystem(inputSystem);

            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'LocalPlayer', true);
            entity.addComponent(player);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            entity.addComponent(movement);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            mockCursors.right.isDown = true;
            mockCursors.up.isDown = true;
            mockFireKey.isDown = true;

            entityManager.update(16);

            expect(movement.rotationInput).toBe(1);
            expect(movement.thrustInput).toBe(1);
            expect(weapon.triggerPulled).toBe(true);
        });
    });
});
