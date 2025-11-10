import Phaser from 'phaser';
import { Component } from '@/ecs/core';

/**
 * UIComponent - Manages UI text elements attached to a player entity.
 *
 * This component handles the visual text displays for player information:
 * - Player name tag (follows sprite)
 * - Level indicator (follows sprite)
 * - Ammo counter (fixed position, local player only)
 *
 * The RenderSystem updates these text positions and content each frame.
 *
 * @example
 * ```typescript
 * const ui = new UIComponent(scene, 'PlayerName', 1, true, 100, 200);
 * entity.addComponent(ui);
 *
 * // Later, update via system
 * ui.updatePosition(newX, newY);
 * ui.updateAmmo(45);
 * ```
 */
export class UIComponent extends Component {
    /** Text display for player name */
    public nameText: Phaser.GameObjects.Text;

    /** Text display for player level */
    public levelText: Phaser.GameObjects.Text;

    /** Text display for ammo count (local player only) */
    public ammoText?: Phaser.GameObjects.Text;

    /** Whether this is the local player (determines if ammo display is shown) */
    public isLocal: boolean;

    /**
     * Creates a new UIComponent with text displays.
     *
     * @param scene - The Phaser scene to add text objects to
     * @param playerName - Player's display name
     * @param level - Player's level (1-5)
     * @param isLocal - True if this is the local player
     * @param x - Initial X position for name/level text
     * @param y - Initial Y position for name/level text
     */
    constructor(scene: Phaser.Scene, playerName: string, level: number, isLocal: boolean, x: number, y: number) {
        super();
        this.isLocal = isLocal;

        // Create player name label
        this.nameText = scene.add
            .text(x, y - 30, playerName, {
                fontSize: '12px',
                color: '#ffffff',
            })
            .setOrigin(0.5);

        // Create level label
        this.levelText = scene.add
            .text(x, y - 18, `Level: ${level}`, {
                fontSize: '10px',
                color: '#ffff00',
            })
            .setOrigin(0.5);

        // Create ammo display for local player only
        if (isLocal) {
            this.ammoText = scene.add
                .text(16, 16, 'Ammo: 0', {
                    fontSize: '18px',
                    color: '#ffffff',
                })
                .setScrollFactor(0);
        }
    }

    /**
     * Updates the position of name and level text to follow the sprite.
     *
     * @param x - X position of the sprite
     * @param y - Y position of the sprite
     */
    public updatePosition(x: number, y: number): void {
        this.nameText.setPosition(x, y - 30);
        this.levelText.setPosition(x, y - 18);
    }

    /**
     * Updates the ammo display text.
     *
     * @param ammo - Current ammo count
     */
    public updateAmmo(ammo: number): void {
        if (this.ammoText) {
            this.ammoText.setText(`Ammo: ${ammo}`);
        }
    }

    /**
     * Updates the level display text.
     *
     * @param level - New level value
     */
    public updateLevel(level: number): void {
        this.levelText.setText(`Level: ${level}`);
    }

    /**
     * Destroys all text objects when the entity is destroyed.
     */
    public destroy(): void {
        this.nameText.destroy();
        this.levelText.destroy();
        this.ammoText?.destroy();
    }
}
