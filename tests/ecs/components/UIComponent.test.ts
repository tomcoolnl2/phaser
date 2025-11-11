import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIComponent } from '@/ecs/components/UIComponent';
import type Phaser from 'phaser';

describe('UIComponent', () => {
    // Mock scene and text objects
    let mockScene: any;
    let mockNameText: any;
    let mockLevelText: any;
    let mockAmmoText: any;

    beforeEach(() => {
        // Reset mocks
        mockNameText = {
            setOrigin: vi.fn().mockReturnThis(),
            setPosition: vi.fn().mockReturnThis(),
            setText: vi.fn().mockReturnThis(),
            destroy: vi.fn(),
        };

        mockLevelText = {
            setOrigin: vi.fn().mockReturnThis(),
            setPosition: vi.fn().mockReturnThis(),
            setText: vi.fn().mockReturnThis(),
            destroy: vi.fn(),
        };

        mockAmmoText = {
            setScrollFactor: vi.fn().mockReturnThis(),
            setText: vi.fn().mockReturnThis(),
            destroy: vi.fn(),
        };

        mockScene = {
            add: {
                text: vi.fn((x: number, y: number, text: string, style: any) => {
                    if (text.startsWith('Ammo:')) {
                        return mockAmmoText;
                    } else if (text.startsWith('Level:')) {
                        return mockLevelText;
                    } else {
                        return mockNameText;
                    }
                }),
            },
        } as unknown as Phaser.Scene;
    });

    describe('constructor - local player', () => {
        it('should create name text with correct properties', () => {
            const ui = new UIComponent(mockScene, 'Alice', 1, true, 100, 200);

            expect(mockScene.add.text).toHaveBeenCalledWith(100, 170, 'Alice', {
                fontSize: '12px',
                color: '#ffffff',
            });
            expect(mockNameText.setOrigin).toHaveBeenCalledWith(0.5);
        });

        it('should create level text with correct properties', () => {
            const ui = new UIComponent(mockScene, 'Bob', 3, true, 100, 200);

            expect(mockScene.add.text).toHaveBeenCalledWith(100, 182, 'Level: 3', {
                fontSize: '10px',
                color: '#ffff00',
            });
            expect(mockLevelText.setOrigin).toHaveBeenCalledWith(0.5);
        });

        it('should create ammo text for local player', () => {
            const ui = new UIComponent(mockScene, 'Charlie', 1, true, 100, 200);

            expect(mockScene.add.text).toHaveBeenCalledWith(16, 16, 'Ammo: 0', {
                fontSize: '18px',
                color: '#ffffff',
            });
            expect(mockAmmoText.setScrollFactor).toHaveBeenCalledWith(0);
            expect(ui.ammoText).toBeDefined();
        });

        it('should set isLocal to true', () => {
            const ui = new UIComponent(mockScene, 'Dave', 1, true, 100, 200);

            expect(ui.isLocal).toBe(true);
        });

        it('should store references to text objects', () => {
            const ui = new UIComponent(mockScene, 'Eve', 2, true, 150, 250);

            expect(ui.nameText).toBe(mockNameText);
            expect(ui.levelText).toBe(mockLevelText);
            expect(ui.ammoText).toBe(mockAmmoText);
        });
    });

    describe('constructor - remote player', () => {
        it('should create name text', () => {
            const ui = new UIComponent(mockScene, 'RemotePlayer', 1, false, 100, 200);

            expect(mockScene.add.text).toHaveBeenCalledWith(100, 170, 'RemotePlayer', {
                fontSize: '12px',
                color: '#ffffff',
            });
        });

        it('should create level text', () => {
            const ui = new UIComponent(mockScene, 'RemotePlayer', 4, false, 100, 200);

            expect(mockScene.add.text).toHaveBeenCalledWith(100, 182, 'Level: 4', {
                fontSize: '10px',
                color: '#ffff00',
            });
        });

        it('should NOT create ammo text for remote player', () => {
            const ui = new UIComponent(mockScene, 'RemotePlayer', 1, false, 100, 200);

            expect(ui.ammoText).toBeUndefined();
        });

        it('should set isLocal to false', () => {
            const ui = new UIComponent(mockScene, 'RemotePlayer', 1, false, 100, 200);

            expect(ui.isLocal).toBe(false);
        });
    });

    describe('updatePosition', () => {
        it('should update name text position', () => {
            const ui = new UIComponent(mockScene, 'Alice', 1, true, 100, 200);

            ui.updatePosition(300, 400);

            expect(mockNameText.setPosition).toHaveBeenCalledWith(300, 370); // 400 - 30
        });

        it('should update level text position', () => {
            const ui = new UIComponent(mockScene, 'Bob', 1, true, 100, 200);

            ui.updatePosition(300, 400);

            expect(mockLevelText.setPosition).toHaveBeenCalledWith(300, 382); // 400 - 18
        });

        it('should handle negative coordinates', () => {
            const ui = new UIComponent(mockScene, 'Charlie', 1, false, 100, 200);

            ui.updatePosition(-50, -100);

            expect(mockNameText.setPosition).toHaveBeenCalledWith(-50, -130);
            expect(mockLevelText.setPosition).toHaveBeenCalledWith(-50, -118);
        });

        it('should handle zero coordinates', () => {
            const ui = new UIComponent(mockScene, 'Dave', 1, true, 100, 200);

            ui.updatePosition(0, 0);

            expect(mockNameText.setPosition).toHaveBeenCalledWith(0, -30);
            expect(mockLevelText.setPosition).toHaveBeenCalledWith(0, -18);
        });

        it('should handle very large coordinates', () => {
            const ui = new UIComponent(mockScene, 'Eve', 1, false, 100, 200);

            ui.updatePosition(10000, 10000);

            expect(mockNameText.setPosition).toHaveBeenCalledWith(10000, 9970);
            expect(mockLevelText.setPosition).toHaveBeenCalledWith(10000, 9982);
        });

        it('should allow multiple position updates', () => {
            const ui = new UIComponent(mockScene, 'Frank', 1, true, 100, 200);

            ui.updatePosition(200, 300);
            ui.updatePosition(400, 500);

            expect(mockNameText.setPosition).toHaveBeenCalledTimes(2);
            expect(mockLevelText.setPosition).toHaveBeenCalledTimes(2);
            expect(mockNameText.setPosition).toHaveBeenLastCalledWith(400, 470);
            expect(mockLevelText.setPosition).toHaveBeenLastCalledWith(400, 482);
        });

        it('should not affect ammo text position', () => {
            const ui = new UIComponent(mockScene, 'Grace', 1, true, 100, 200);

            ui.updatePosition(300, 400);

            // Ammo text is fixed to screen, not affected by updatePosition
            expect(mockAmmoText.setScrollFactor).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateAmmo', () => {
        it('should update ammo text for local player', () => {
            const ui = new UIComponent(mockScene, 'Alice', 1, true, 100, 200);

            ui.updateAmmo(45);

            expect(mockAmmoText.setText).toHaveBeenCalledWith('Ammo: 45');
        });

        it('should handle zero ammo', () => {
            const ui = new UIComponent(mockScene, 'Bob', 1, true, 100, 200);

            ui.updateAmmo(0);

            expect(mockAmmoText.setText).toHaveBeenCalledWith('Ammo: 0');
        });

        it('should handle maximum ammo', () => {
            const ui = new UIComponent(mockScene, 'Charlie', 1, true, 100, 200);

            ui.updateAmmo(100);

            expect(mockAmmoText.setText).toHaveBeenCalledWith('Ammo: 100');
        });

        it('should handle multiple ammo updates', () => {
            const ui = new UIComponent(mockScene, 'Dave', 1, true, 100, 200);

            ui.updateAmmo(50);
            ui.updateAmmo(45);
            ui.updateAmmo(40);

            expect(mockAmmoText.setText).toHaveBeenCalledTimes(3);
            expect(mockAmmoText.setText).toHaveBeenLastCalledWith('Ammo: 40');
        });

        it('should NOT update ammo for remote player (no ammo text)', () => {
            const ui = new UIComponent(mockScene, 'RemotePlayer', 1, false, 100, 200);

            // Should not throw error even though ammoText is undefined
            expect(() => ui.updateAmmo(50)).not.toThrow();
        });

        it('should handle negative ammo values (edge case)', () => {
            const ui = new UIComponent(mockScene, 'Eve', 1, true, 100, 200);

            ui.updateAmmo(-5);

            expect(mockAmmoText.setText).toHaveBeenCalledWith('Ammo: -5');
        });

        it('should handle very large ammo values', () => {
            const ui = new UIComponent(mockScene, 'Frank', 1, true, 100, 200);

            ui.updateAmmo(9999);

            expect(mockAmmoText.setText).toHaveBeenCalledWith('Ammo: 9999');
        });
    });

    describe('updateLevel', () => {
        it('should update level text', () => {
            const ui = new UIComponent(mockScene, 'Alice', 1, true, 100, 200);

            ui.updateLevel(3);

            expect(mockLevelText.setText).toHaveBeenCalledWith('Level: 3');
        });

        it('should handle level 1', () => {
            const ui = new UIComponent(mockScene, 'Bob', 5, false, 100, 200);

            ui.updateLevel(1);

            expect(mockLevelText.setText).toHaveBeenCalledWith('Level: 1');
        });

        it('should handle maximum level (5)', () => {
            const ui = new UIComponent(mockScene, 'Charlie', 1, true, 100, 200);

            ui.updateLevel(5);

            expect(mockLevelText.setText).toHaveBeenCalledWith('Level: 5');
        });

        it('should handle multiple level updates', () => {
            const ui = new UIComponent(mockScene, 'Dave', 1, false, 100, 200);

            ui.updateLevel(2);
            ui.updateLevel(3);
            ui.updateLevel(4);

            expect(mockLevelText.setText).toHaveBeenCalledTimes(3);
            expect(mockLevelText.setText).toHaveBeenLastCalledWith('Level: 4');
        });

        it('should work for both local and remote players', () => {
            const localUI = new UIComponent(mockScene, 'Local', 1, true, 100, 200);
            const remoteUI = new UIComponent(mockScene, 'Remote', 1, false, 100, 200);

            localUI.updateLevel(3);
            remoteUI.updateLevel(4);

            expect(mockLevelText.setText).toHaveBeenCalledWith('Level: 3');
            expect(mockLevelText.setText).toHaveBeenCalledWith('Level: 4');
        });

        it('should handle level 0 (edge case)', () => {
            const ui = new UIComponent(mockScene, 'Eve', 1, true, 100, 200);

            ui.updateLevel(0);

            expect(mockLevelText.setText).toHaveBeenCalledWith('Level: 0');
        });

        it('should handle level beyond max (edge case)', () => {
            const ui = new UIComponent(mockScene, 'Frank', 1, false, 100, 200);

            ui.updateLevel(10);

            expect(mockLevelText.setText).toHaveBeenCalledWith('Level: 10');
        });
    });

    describe('destroy', () => {
        it('should destroy name text', () => {
            const ui = new UIComponent(mockScene, 'Alice', 1, false, 100, 200);

            ui.destroy();

            expect(mockNameText.destroy).toHaveBeenCalledTimes(1);
        });

        it('should destroy level text', () => {
            const ui = new UIComponent(mockScene, 'Bob', 1, false, 100, 200);

            ui.destroy();

            expect(mockLevelText.destroy).toHaveBeenCalledTimes(1);
        });

        it('should destroy ammo text for local player', () => {
            const ui = new UIComponent(mockScene, 'Charlie', 1, true, 100, 200);

            ui.destroy();

            expect(mockAmmoText.destroy).toHaveBeenCalledTimes(1);
        });

        it('should NOT throw when destroying remote player (no ammo text)', () => {
            const ui = new UIComponent(mockScene, 'RemotePlayer', 1, false, 100, 200);

            expect(() => ui.destroy()).not.toThrow();
            expect(mockNameText.destroy).toHaveBeenCalledTimes(1);
            expect(mockLevelText.destroy).toHaveBeenCalledTimes(1);
        });

        it('should destroy all text objects in correct order', () => {
            const ui = new UIComponent(mockScene, 'Dave', 1, true, 100, 200);

            ui.destroy();

            expect(mockNameText.destroy).toHaveBeenCalled();
            expect(mockLevelText.destroy).toHaveBeenCalled();
            expect(mockAmmoText.destroy).toHaveBeenCalled();
        });
    });

    describe('integration scenarios', () => {
        it('should handle full lifecycle for local player', () => {
            const ui = new UIComponent(mockScene, 'Alice', 1, true, 100, 200);

            // Update position multiple times
            ui.updatePosition(150, 250);
            ui.updatePosition(200, 300);

            // Update ammo
            ui.updateAmmo(50);
            ui.updateAmmo(45);

            // Level up
            ui.updateLevel(2);
            ui.updateLevel(3);

            // Destroy
            ui.destroy();

            expect(mockNameText.setPosition).toHaveBeenCalledTimes(2);
            expect(mockAmmoText.setText).toHaveBeenCalledTimes(2);
            expect(mockLevelText.setText).toHaveBeenCalledTimes(2);
            expect(mockNameText.destroy).toHaveBeenCalled();
        });

        it('should handle full lifecycle for remote player', () => {
            const ui = new UIComponent(mockScene, 'RemotePlayer', 2, false, 100, 200);

            // Update position
            ui.updatePosition(300, 400);

            // Try to update ammo (should not throw)
            ui.updateAmmo(50);

            // Level up
            ui.updateLevel(3);

            // Destroy
            ui.destroy();

            expect(mockNameText.setPosition).toHaveBeenCalled();
            expect(mockLevelText.setText).toHaveBeenCalledWith('Level: 3');
            expect(mockNameText.destroy).toHaveBeenCalled();
        });

        it('should maintain independent state for multiple UI components', () => {
            const ui1 = new UIComponent(mockScene, 'Player1', 1, true, 100, 200);
            const ui2 = new UIComponent(mockScene, 'Player2', 2, false, 300, 400);

            ui1.updatePosition(150, 250);
            ui2.updatePosition(350, 450);

            ui1.updateLevel(2);
            ui2.updateLevel(3);

            // Both should maintain independent state
            expect(mockNameText.setPosition).toHaveBeenCalledTimes(2);
            expect(mockLevelText.setText).toHaveBeenCalledTimes(2);
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle empty player name', () => {
            const ui = new UIComponent(mockScene, '', 1, false, 100, 200);

            expect(mockScene.add.text).toHaveBeenCalledWith(100, 170, '', {
                fontSize: '12px',
                color: '#ffffff',
            });
        });

        it('should handle very long player names', () => {
            const longName = 'VeryLongPlayerNameThatExceedsNormalLimits123456789';
            const ui = new UIComponent(mockScene, longName, 1, false, 100, 200);

            expect(mockScene.add.text).toHaveBeenCalledWith(100, 170, longName, {
                fontSize: '12px',
                color: '#ffffff',
            });
        });

        it('should handle special characters in player name', () => {
            const specialName = 'Player™️💀🔥';
            const ui = new UIComponent(mockScene, specialName, 1, true, 100, 200);

            expect(mockScene.add.text).toHaveBeenCalledWith(100, 170, specialName, {
                fontSize: '12px',
                color: '#ffffff',
            });
        });

        it('should handle fractional position coordinates', () => {
            const ui = new UIComponent(mockScene, 'Alice', 1, false, 100.5, 200.7);

            ui.updatePosition(150.3, 250.9);

            expect(mockNameText.setPosition).toHaveBeenCalledWith(150.3, 220.9);
        });
    });
});
