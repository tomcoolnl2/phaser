import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RenderSystem } from '@/ecs/systems/RenderSystem';
import { EntityManager } from '@/ecs/core/EntityManager';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { UIComponent } from '@/ecs/components/UIComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';

describe('RenderSystem', () => {
    let mockScene: any;
    let entityManager: EntityManager;
    let renderSystem: RenderSystem;

    beforeEach(() => {
        // Mock Phaser scene
        mockScene = {
            physics: {
                add: {
                    sprite: vi.fn((x: number, y: number, texture: string) => ({
                        x,
                        y,
                        texture,
                        rotation: 0,
                        setOrigin: vi.fn().mockReturnThis(),
                        setPosition: vi.fn().mockReturnThis(),
                        destroy: vi.fn(),
                    })),
                    group: vi.fn(() => ({
                        get: vi.fn(),
                        create: vi.fn(),
                        killAndHide: vi.fn(),
                        clear: vi.fn(),
                    })),
                },
            },
            add: {
                text: vi.fn((x: number, y: number, text: string, style: any) => ({
                    x,
                    y,
                    text,
                    style,
                    setOrigin: vi.fn().mockReturnThis(),
                    setDepth: vi.fn().mockReturnThis(),
                    setScrollFactor: vi.fn().mockReturnThis(),
                    setText: vi.fn(function (this: any, newText: string) {
                        this.text = newText;
                        return this;
                    }),
                    setPosition: vi.fn(function (this: any, newX: number, newY: number) {
                        this.x = newX;
                        this.y = newY;
                        return this;
                    }),
                    setVisible: vi.fn().mockReturnThis(),
                    destroy: vi.fn(),
                })),
            },
        };

        entityManager = new EntityManager(mockScene);
        renderSystem = new RenderSystem(mockScene);
    });

    describe('Component Requirements', () => {
        it('should require TransformComponent and UIComponent', () => {
            const required = renderSystem.getRequiredComponents();

            expect(required).toContain(TransformComponent);
            expect(required).toContain(UIComponent);
            expect(required).toHaveLength(2);
        });
    });

    describe('UI Position Updates', () => {
        it('should update UI position to follow sprite', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 200, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const ui = new UIComponent(mockScene, 'TestPlayer', 1, false, 100, 200);
            entity.addComponent(ui);

            const updatePositionSpy = vi.spyOn(ui, 'updatePosition');

            // Update sprite position
            sprite.x = 150;
            sprite.y = 250;

            renderSystem.update(entity, 16);

            expect(updatePositionSpy).toHaveBeenCalledWith(150, 250);
        });

        it('should update UI every frame', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const ui = new UIComponent(mockScene, 'Player', 1, false, 100, 100);
            entity.addComponent(ui);

            const updatePositionSpy = vi.spyOn(ui, 'updatePosition');

            // Multiple updates
            renderSystem.update(entity, 16);
            renderSystem.update(entity, 16);
            renderSystem.update(entity, 16);

            expect(updatePositionSpy).toHaveBeenCalledTimes(3);
        });

        it('should handle sprite at origin', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(0, 0, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const ui = new UIComponent(mockScene, 'Player', 1, false, 0, 0);
            entity.addComponent(ui);

            const updatePositionSpy = vi.spyOn(ui, 'updatePosition');

            renderSystem.update(entity, 16);

            expect(updatePositionSpy).toHaveBeenCalledWith(0, 0);
        });
    });

    describe('Ammo Display Updates', () => {
        it('should update ammo display for local player with weapon', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const ui = new UIComponent(mockScene, 'LocalPlayer', 1, true, 100, 100);
            entity.addComponent(ui);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            const updateAmmoSpy = vi.spyOn(ui, 'updateAmmo');

            renderSystem.update(entity, 16);

            expect(updateAmmoSpy).toHaveBeenCalledWith(50);
        });

        it('should not update ammo display for remote player', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const ui = new UIComponent(mockScene, 'RemotePlayer', 1, false, 100, 100);
            entity.addComponent(ui);

            const updateAmmoSpy = vi.spyOn(ui, 'updateAmmo');

            renderSystem.update(entity, 16);

            expect(updateAmmoSpy).not.toHaveBeenCalled();
        });

        it('should not update ammo display for local player without weapon', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const ui = new UIComponent(mockScene, 'LocalPlayer', 1, true, 100, 100);
            entity.addComponent(ui);

            const updateAmmoSpy = vi.spyOn(ui, 'updateAmmo');

            renderSystem.update(entity, 16);

            expect(updateAmmoSpy).not.toHaveBeenCalled();
        });

        it('should update ammo display when ammo changes', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const ui = new UIComponent(mockScene, 'LocalPlayer', 1, true, 100, 100);
            entity.addComponent(ui);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            const updateAmmoSpy = vi.spyOn(ui, 'updateAmmo');

            // Initial update
            renderSystem.update(entity, 16);
            expect(updateAmmoSpy).toHaveBeenCalledWith(50);

            // Change ammo
            weapon.ammo = 30;
            renderSystem.update(entity, 16);
            expect(updateAmmoSpy).toHaveBeenCalledWith(30);

            expect(updateAmmoSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('Level Display Updates', () => {
        it('should update level display when level changes', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const ui = new UIComponent(mockScene, 'Player', 1, false, 100, 100);
            entity.addComponent(ui);

            const player = new PlayerComponent('p1', 'Player', false, 1);
            entity.addComponent(player);

            const updateLevelSpy = vi.spyOn(ui, 'updateLevel');

            // Initial update - level is 1, text should be "Level: 1"
            renderSystem.update(entity, 16);

            // Change level
            player.level = 2;
            renderSystem.update(entity, 16);

            expect(updateLevelSpy).toHaveBeenCalledWith(2);
        });

        it('should not update level display when level unchanged', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const ui = new UIComponent(mockScene, 'Player', 1, false, 100, 100);
            entity.addComponent(ui);

            const player = new PlayerComponent('p1', 'Player', false, 1);
            entity.addComponent(player);

            const updateLevelSpy = vi.spyOn(ui, 'updateLevel');

            // Multiple updates with same level
            renderSystem.update(entity, 16);
            renderSystem.update(entity, 16);
            renderSystem.update(entity, 16);

            // Should not call updateLevel after initial render since level hasn't changed
            expect(updateLevelSpy).not.toHaveBeenCalled();
        });

        it('should handle entity without PlayerComponent', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const ui = new UIComponent(mockScene, 'Entity', 1, false, 100, 100);
            entity.addComponent(ui);

            const updateLevelSpy = vi.spyOn(ui, 'updateLevel');

            renderSystem.update(entity, 16);

            expect(updateLevelSpy).not.toHaveBeenCalled();
        });

        it('should detect level text change correctly', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const ui = new UIComponent(mockScene, 'Player', 1, false, 100, 100);
            entity.addComponent(ui);

            const player = new PlayerComponent('p1', 'Player', false, 1);
            entity.addComponent(player);

            const updateLevelSpy = vi.spyOn(ui, 'updateLevel');

            // First update
            renderSystem.update(entity, 16);

            // Level up multiple times
            player.level = 2;
            renderSystem.update(entity, 16);

            player.level = 3;
            renderSystem.update(entity, 16);

            player.level = 4;
            renderSystem.update(entity, 16);

            expect(updateLevelSpy).toHaveBeenCalledTimes(3);
            expect(updateLevelSpy).toHaveBeenCalledWith(2);
            expect(updateLevelSpy).toHaveBeenCalledWith(3);
            expect(updateLevelSpy).toHaveBeenCalledWith(4);
        });
    });

    describe('Integration Tests', () => {
        it('should update all UI elements for complete entity', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            sprite.x = 200;
            sprite.y = 300;

            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const ui = new UIComponent(mockScene, 'CompletePlayer', 2, true, 100, 100);
            entity.addComponent(ui);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 75, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            const player = new PlayerComponent('p1', 'CompletePlayer', true, 2);
            entity.addComponent(player);

            const updatePositionSpy = vi.spyOn(ui, 'updatePosition');
            const updateAmmoSpy = vi.spyOn(ui, 'updateAmmo');

            renderSystem.update(entity, 16);

            expect(updatePositionSpy).toHaveBeenCalledWith(200, 300);
            expect(updateAmmoSpy).toHaveBeenCalledWith(75);
        });

        it('should work with EntityManager system updates', () => {
            entityManager.addSystem(renderSystem);

            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const ui = new UIComponent(mockScene, 'Player', 1, true, 100, 100);
            entity.addComponent(ui);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser');
            entity.addComponent(weapon);

            const updatePositionSpy = vi.spyOn(ui, 'updatePosition');
            const updateAmmoSpy = vi.spyOn(ui, 'updateAmmo');

            // EntityManager should call RenderSystem
            entityManager.update(16);

            expect(updatePositionSpy).toHaveBeenCalled();
            expect(updateAmmoSpy).toHaveBeenCalled();
        });

        it('should handle rapid updates efficiently', () => {
            const entity = entityManager.createEntity();

            const sprite = mockScene.physics.add.sprite(100, 100, 'test');
            const transform = new TransformComponent(sprite);
            entity.addComponent(transform);

            const ui = new UIComponent(mockScene, 'Player', 1, false, 100, 100);
            entity.addComponent(ui);

            const updatePositionSpy = vi.spyOn(ui, 'updatePosition');

            // Simulate 60 FPS for 1 second
            for (let i = 0; i < 60; i++) {
                renderSystem.update(entity, 16);
            }

            expect(updatePositionSpy).toHaveBeenCalledTimes(60);
        });
    });
});
