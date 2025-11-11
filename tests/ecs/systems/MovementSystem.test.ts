import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MovementSystem } from '@/ecs/systems/MovementSystem';
import { EntityManager } from '@/ecs/core/EntityManager';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { MovementComponent } from '@/ecs/components/MovementComponent';

describe('MovementSystem', () => {
    let mockScene: any;
    let entityManager: EntityManager;
    let movementSystem: MovementSystem;

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
                            body: {
                                velocity: { x: 0, y: 0 },
                            },
                            setOrigin: vi.fn().mockReturnThis(),
                            destroy: vi.fn(),
                        };
                        return sprite;
                    }),
                },
                velocityFromRotation: vi.fn((rotation: number, speed: number, vec: any) => {
                    // Simple mock: just set velocity based on rotation
                    vec.x = Math.cos(rotation) * speed;
                    vec.y = Math.sin(rotation) * speed;
                    return vec;
                }),
            },
        };

        entityManager = new EntityManager(mockScene);
        movementSystem = new MovementSystem(mockScene);
    });

    describe('Component Requirements', () => {
        it('should require TransformComponent and MovementComponent', () => {
            const required = movementSystem.getRequiredComponents();

            expect(required).toContain(TransformComponent);
            expect(required).toContain(MovementComponent);
            expect(required).toHaveLength(2);
        });
    });

    describe('Rotation', () => {
        it('should rotate entity based on rotationInput', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            movement.targetRotation = 0;
            movement.rotationInput = 1; // Rotate right
            entity.addComponent(movement);

            movementSystem.update(entity, 16);

            expect(movement.targetRotation).toBe(0.03); // Initial 0 + (1 * 0.03)
            expect(sprite.rotation).toBe(0.03);
        });

        it('should rotate left when rotationInput is negative', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            movement.targetRotation = 0;
            movement.rotationInput = -1; // Rotate left
            entity.addComponent(movement);

            movementSystem.update(entity, 16);

            expect(movement.targetRotation).toBe(-0.03); // Initial 0 + (-1 * 0.03)
            expect(sprite.rotation).toBe(-0.03);
        });

        it('should not rotate when rotationInput is 0', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            movement.targetRotation = 1.5;
            movement.rotationInput = 0;
            entity.addComponent(movement);

            movementSystem.update(entity, 16);

            expect(movement.targetRotation).toBe(1.5); // Should not change
            expect(sprite.rotation).toBe(1.5);
        });

        it('should accumulate rotation over multiple frames', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            movement.targetRotation = 0;
            movement.rotationInput = 1;
            entity.addComponent(movement);

            movementSystem.update(entity, 16);
            movementSystem.update(entity, 16);
            movementSystem.update(entity, 16);

            expect(movement.targetRotation).toBeCloseTo(0.09, 5); // 3 frames * 0.03
        });
    });

    describe('Thrust', () => {
        it('should apply velocity when thrusting', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            sprite.rotation = 0; // Facing right
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            movement.thrustInput = 1; // Thrusting
            entity.addComponent(movement);

            movementSystem.update(entity, 16);

            expect(mockScene.physics.velocityFromRotation).toHaveBeenCalledWith(
                0,
                200,
                sprite.body.velocity
            );
            expect(sprite.body.velocity.x).toBeCloseTo(200, 1);
            expect(sprite.body.velocity.y).toBeCloseTo(0, 1);
        });

        it('should apply velocity in direction of rotation', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            movement.targetRotation = Math.PI / 2; // Facing down
            movement.thrustInput = 1;
            entity.addComponent(movement);

            movementSystem.update(entity, 16);

            expect(mockScene.physics.velocityFromRotation).toHaveBeenCalledWith(
                Math.PI / 2,
                200,
                sprite.body.velocity
            );
        });

        it('should not apply velocity when not thrusting', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            sprite.body.velocity.x = 50;
            sprite.body.velocity.y = 50;
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            movement.thrustInput = 0; // Not thrusting
            entity.addComponent(movement);

            movementSystem.update(entity, 16);

            // Should apply drag instead
            expect(sprite.body.velocity.x).toBeCloseTo(50 * 0.97, 5);
            expect(sprite.body.velocity.y).toBeCloseTo(50 * 0.97, 5);
        });
    });

    describe('Braking', () => {
        it('should slow down quickly when braking', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            sprite.body.velocity.x = 100;
            sprite.body.velocity.y = 100;
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            movement.brakeInput = true;
            entity.addComponent(movement);

            movementSystem.update(entity, 16);

            expect(sprite.body.velocity.x).toBe(85); // 100 * 0.85
            expect(sprite.body.velocity.y).toBe(85); // 100 * 0.85
        });

        it('should brake faster than drift', () => {
            const entity1 = entityManager.createEntity();
            const sprite1 = mockScene.physics.add.sprite(100, 100, 'test');
            sprite1.body.velocity.x = 100;
            sprite1.body.velocity.y = 100;
            const transform1 = new TransformComponent(sprite1);
            entity1.addComponent(transform1);
            const movement1 = new MovementComponent(200, 500, 0.97, 0.03);
            movement1.brakeInput = true;
            entity1.addComponent(movement1);

            const entity2 = entityManager.createEntity();
            const sprite2 = mockScene.physics.add.sprite(100, 100, 'test');
            sprite2.body.velocity.x = 100;
            sprite2.body.velocity.y = 100;
            const transform2 = new TransformComponent(sprite2);
            entity2.addComponent(transform2);
            const movement2 = new MovementComponent(200, 500, 0.97, 0.03);
            // Not braking, just drifting
            entity2.addComponent(movement2);

            movementSystem.update(entity1, 16); // Braking
            movementSystem.update(entity2, 16); // Drifting

            // Braking (0.85) should reduce velocity more than drift (0.97)
            expect(sprite1.body.velocity.x).toBeLessThan(sprite2.body.velocity.x);
            expect(sprite1.body.velocity.y).toBeLessThan(sprite2.body.velocity.y);
        });
    });

    describe('Drift (Drag)', () => {
        it('should apply drag when coasting', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            sprite.body.velocity.x = 100;
            sprite.body.velocity.y = 100;
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            // No thrust, no brake
            entity.addComponent(movement);

            movementSystem.update(entity, 16);

            expect(sprite.body.velocity.x).toBe(97); // 100 * 0.97
            expect(sprite.body.velocity.y).toBe(97); // 100 * 0.97
        });

        it('should gradually slow down over time', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            sprite.body.velocity.x = 100;
            sprite.body.velocity.y = 0;
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            entity.addComponent(movement);

            // Simulate multiple frames
            movementSystem.update(entity, 16);
            movementSystem.update(entity, 16);
            movementSystem.update(entity, 16);

            expect(sprite.body.velocity.x).toBeCloseTo(100 * 0.97 * 0.97 * 0.97, 5);
        });
    });

    describe('CanMove Flag', () => {
        it('should not apply movement when canMove is false', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            sprite.rotation = 0;
            sprite.body.velocity.x = 100;
            sprite.body.velocity.y = 100;
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            movement.canMove = false;
            movement.thrustInput = 1;
            movement.rotationInput = 1;
            entity.addComponent(movement);

            const initialRotation = sprite.rotation;
            const initialVelocityX = sprite.body.velocity.x;
            const initialVelocityY = sprite.body.velocity.y;

            movementSystem.update(entity, 16);

            // Nothing should have changed
            expect(sprite.rotation).toBe(initialRotation);
            expect(sprite.body.velocity.x).toBe(initialVelocityX);
            expect(sprite.body.velocity.y).toBe(initialVelocityY);
        });
    });

    describe('Missing Components', () => {
        it('should handle missing sprite', () => {
            const entity = entityManager.createEntity();

            const transform = new TransformComponent(null as any);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            entity.addComponent(movement);

            expect(() => movementSystem.update(entity, 16)).not.toThrow();
        });
    });

    describe('Combined Movement', () => {
        it('should handle rotating and thrusting simultaneously', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            sprite.rotation = 0;
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            movement.targetRotation = 0;
            movement.rotationInput = 1;
            movement.thrustInput = 1;
            entity.addComponent(movement);

            movementSystem.update(entity, 16);

            // Rotation should have changed
            expect(sprite.rotation).toBe(0.03);
            // Velocity should be applied
            expect(mockScene.physics.velocityFromRotation).toHaveBeenCalled();
        });

        it('should prioritize thrust over drift', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            sprite.body.velocity.x = 50;
            sprite.body.velocity.y = 50;
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            movement.thrustInput = 1;
            entity.addComponent(movement);

            movementSystem.update(entity, 16);

            // Should apply thrust velocity, not drift
            expect(mockScene.physics.velocityFromRotation).toHaveBeenCalled();
            // Velocity should be overwritten by thrust
            expect(sprite.body.velocity.x).not.toBe(50 * 0.97);
        });

        it('should prioritize brake over drift', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            sprite.body.velocity.x = 100;
            sprite.body.velocity.y = 100;
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            movement.brakeInput = true;
            entity.addComponent(movement);

            movementSystem.update(entity, 16);

            // Should apply brake (0.85), not drift (0.97)
            expect(sprite.body.velocity.x).toBe(85);
        });
    });

    describe('Integration with EntityManager', () => {
        it('should work when added to EntityManager', () => {
            entityManager.addSystem(movementSystem);

            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const movement = new MovementComponent(200, 500, 0.97, 0.03);
            movement.rotationInput = 1;
            movement.thrustInput = 1;
            entity.addComponent(movement);

            entityManager.update(16);

            expect(sprite.rotation).toBe(0.03);
            expect(mockScene.physics.velocityFromRotation).toHaveBeenCalled();
        });
    });
});
