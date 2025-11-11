import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WeaponUpgradeSystem } from '@/ecs/systems/WeaponUpgradeSystem';
import { EntityManager } from '@/ecs/core/EntityManager';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';

describe('WeaponUpgradeSystem', () => {
    let mockScene: any;
    let entityManager: EntityManager;
    let weaponUpgradeSystem: WeaponUpgradeSystem;

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
        weaponUpgradeSystem = new WeaponUpgradeSystem(mockScene);
    });

    describe('Component Requirements', () => {
        it('should require PlayerComponent and WeaponComponent', () => {
            const required = weaponUpgradeSystem.getRequiredComponents();

            expect(required).toContain(PlayerComponent);
            expect(required).toContain(WeaponComponent);
            expect(required).toHaveLength(2);
        });
    });

    describe('Bullet Sprite Updates', () => {
        it('should update bullet sprite to match player level', () => {
            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'Player', true, 1);
            entity.addComponent(player);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser-level-1');
            entity.addComponent(weapon);

            // Level up player
            player.setLevel(2);

            weaponUpgradeSystem.update(entity, 16);

            expect(weapon.bulletSpriteKey).toBe('laser-level-2');
        });

        it('should update to correct sprite for each level', () => {
            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'Player', true, 1);
            entity.addComponent(player);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser-level-1');
            entity.addComponent(weapon);

            // Test all levels
            const levels = [1, 2, 3, 4, 5] as const;
            for (const level of levels) {
                player.setLevel(level);
                weaponUpgradeSystem.update(entity, 16);
                expect(weapon.bulletSpriteKey).toBe(`laser-level-${level}`);
            }
        });

        it('should not update sprite if already correct', () => {
            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'Player', true, 2);
            entity.addComponent(player);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser-level-2');
            entity.addComponent(weapon);

            const initialSpriteKey = weapon.bulletSpriteKey;

            weaponUpgradeSystem.update(entity, 16);

            // Should remain the same
            expect(weapon.bulletSpriteKey).toBe(initialSpriteKey);
        });

        it('should detect and update sprite mismatch', () => {
            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'Player', true, 3);
            entity.addComponent(player);

            const bulletGroup = mockScene.physics.add.group();
            // Weapon has wrong sprite for level 3 player
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser-level-1');
            entity.addComponent(weapon);

            weaponUpgradeSystem.update(entity, 16);

            expect(weapon.bulletSpriteKey).toBe('laser-level-3');
        });
    });

    describe('Level Changes', () => {
        it('should handle level up during gameplay', () => {
            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'Player', true, 1);
            entity.addComponent(player);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser-level-1');
            entity.addComponent(weapon);

            // First update - level 1
            weaponUpgradeSystem.update(entity, 16);
            expect(weapon.bulletSpriteKey).toBe('laser-level-1');

            // Player levels up
            player.setLevel(2);

            // Second update - level 2
            weaponUpgradeSystem.update(entity, 16);
            expect(weapon.bulletSpriteKey).toBe('laser-level-2');

            // Player levels up again
            player.setLevel(3);

            // Third update - level 3
            weaponUpgradeSystem.update(entity, 16);
            expect(weapon.bulletSpriteKey).toBe('laser-level-3');
        });

        it('should handle level down (if ever needed)', () => {
            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'Player', true, 5);
            entity.addComponent(player);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser-level-5');
            entity.addComponent(weapon);

            // Somehow player level decreases
            player.setLevel(3);

            weaponUpgradeSystem.update(entity, 16);

            expect(weapon.bulletSpriteKey).toBe('laser-level-3');
        });
    });

    describe('Missing Components', () => {
        it('should handle missing PlayerComponent', () => {
            const entity = entityManager.createEntity();

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser-level-1');
            entity.addComponent(weapon);

            expect(() => weaponUpgradeSystem.update(entity, 16)).not.toThrow();
        });

        it('should handle missing WeaponComponent', () => {
            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'Player', true, 2);
            entity.addComponent(player);

            expect(() => weaponUpgradeSystem.update(entity, 16)).not.toThrow();
        });

        it('should handle both components missing', () => {
            const entity = entityManager.createEntity();

            expect(() => weaponUpgradeSystem.update(entity, 16)).not.toThrow();
        });
    });

    describe('Multiple Entities', () => {
        it('should update bullet sprites for multiple players', () => {
            const entity1 = entityManager.createEntity();
            const player1 = new PlayerComponent('p1', 'Player1', true, 1);
            entity1.addComponent(player1);
            const bulletGroup1 = mockScene.physics.add.group();
            const weapon1 = new WeaponComponent(bulletGroup1, 50, 100, 500, 400, 1, 'laser-level-1');
            entity1.addComponent(weapon1);

            const entity2 = entityManager.createEntity();
            const player2 = new PlayerComponent('p2', 'Player2', false, 3);
            entity2.addComponent(player2);
            const bulletGroup2 = mockScene.physics.add.group();
            const weapon2 = new WeaponComponent(bulletGroup2, 50, 100, 500, 400, 1, 'laser-level-1');
            entity2.addComponent(weapon2);

            weaponUpgradeSystem.update(entity1, 16);
            weaponUpgradeSystem.update(entity2, 16);

            expect(weapon1.bulletSpriteKey).toBe('laser-level-1');
            expect(weapon2.bulletSpriteKey).toBe('laser-level-3');
        });

        it('should handle entities at different levels', () => {
            const entities = [];

            for (let level = 1; level <= 5; level++) {
                const entity = entityManager.createEntity();
                const player = new PlayerComponent(`p${level}`, `Player${level}`, level === 1, level as any);
                entity.addComponent(player);
                const bulletGroup = mockScene.physics.add.group();
                const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser-level-1');
                entity.addComponent(weapon);
                entities.push({ entity, weapon });
            }

            // Update all entities
            entities.forEach(({ entity }) => weaponUpgradeSystem.update(entity, 16));

            // Verify each has correct sprite
            entities.forEach(({ weapon }, index) => {
                expect(weapon.bulletSpriteKey).toBe(`laser-level-${index + 1}`);
            });
        });
    });

    describe('Integration with EntityManager', () => {
        it('should work when added to EntityManager', () => {
            entityManager.addSystem(weaponUpgradeSystem);

            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'Player', true, 1);
            entity.addComponent(player);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser-level-1');
            entity.addComponent(weapon);

            // Level up
            player.setLevel(2);

            // EntityManager update should call system
            entityManager.update(16);

            expect(weapon.bulletSpriteKey).toBe('laser-level-2');
        });

        it('should update continuously as levels change', () => {
            entityManager.addSystem(weaponUpgradeSystem);

            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'Player', true, 1);
            entity.addComponent(player);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser-level-1');
            entity.addComponent(weapon);

            // Simulate gameplay with level ups
            entityManager.update(16); // Level 1
            expect(weapon.bulletSpriteKey).toBe('laser-level-1');

            player.setLevel(2);
            entityManager.update(16); // Level 2
            expect(weapon.bulletSpriteKey).toBe('laser-level-2');

            player.setLevel(3);
            entityManager.update(16); // Level 3
            expect(weapon.bulletSpriteKey).toBe('laser-level-3');

            player.setLevel(4);
            entityManager.update(16); // Level 4
            expect(weapon.bulletSpriteKey).toBe('laser-level-4');

            player.setLevel(5);
            entityManager.update(16); // Level 5
            expect(weapon.bulletSpriteKey).toBe('laser-level-5');
        });
    });

    describe('Edge Cases', () => {
        it('should handle starting at max level', () => {
            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'Player', true, 5);
            entity.addComponent(player);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser-level-1');
            entity.addComponent(weapon);

            weaponUpgradeSystem.update(entity, 16);

            expect(weapon.bulletSpriteKey).toBe('laser-level-5');
        });

        it('should handle rapid level changes', () => {
            const entity = entityManager.createEntity();

            const player = new PlayerComponent('p1', 'Player', true, 1);
            entity.addComponent(player);

            const bulletGroup = mockScene.physics.add.group();
            const weapon = new WeaponComponent(bulletGroup, 50, 100, 500, 400, 1, 'laser-level-1');
            entity.addComponent(weapon);

            // Rapid level changes in same frame
            player.setLevel(2);
            player.setLevel(3);
            player.setLevel(4);

            weaponUpgradeSystem.update(entity, 16);

            expect(weapon.bulletSpriteKey).toBe('laser-level-4');
        });
    });
});
