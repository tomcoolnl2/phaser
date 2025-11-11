import * as Phaser from 'phaser';
import { ComponentClass, Entity, System } from '@/ecs/core';
import { TransformComponent, UIComponent, WeaponComponent, PlayerComponent } from '@/ecs/components';

/**
 * RenderSystem - Updates UI text elements to follow sprites and display current state.
 *
 * This system handles visual updates for player UI elements:
 * - Updates name/level text positions to follow the player sprite
 * - Updates ammo counter text for local players
 * - Updates level display when player levels up
 *
 * Runs every frame to keep UI synchronized with game state.
 *
 * @example
 * ```typescript
 * const renderSystem = new RenderSystem(scene);
 * entityManager.addSystem(renderSystem);
 * ```
 */
export class RenderSystem extends System {
    /**
     * Creates a new RenderSystem.
     * @param scene - The Phaser scene (not used but required by base System class)
     */
    constructor(scene: Phaser.Scene) {
        super(scene);
    }

    /**
     * Specifies required components: TransformComponent and UIComponent.
     * Only entities with both components will be processed.
     */
    public getRequiredComponents(): ComponentClass[] {
        return [TransformComponent, UIComponent];
    }

    /**
     * Updates UI elements for a single entity.
     *
     * Updates:
     * - Name/level text position to follow sprite
     * - Ammo text content (if local player with weapon)
     * - Level text content (if changed)
     *
     * @param entity - The entity to update
     * @param _deltaTime - Time elapsed since last frame (unused)
     */
    public update(entity: Entity, _deltaTime: number): void {
        const transform = entity.getComponent(TransformComponent)!;
        const ui = entity.getComponent(UIComponent)!;
        const weapon = entity.getComponent(WeaponComponent);
        const player = entity.getComponent(PlayerComponent);

        // Update name/level text position to follow sprite
        ui.updatePosition(transform.sprite.x, transform.sprite.y);

        // Update ammo display for local player
        if (ui.isLocal && weapon) {
            ui.updateAmmo(weapon.ammo);
        }

        // Update level display if player component exists
        if (player) {
            const currentLevelText = ui.levelText.text;
            const newLevelText = `Level: ${player.level}`;
            if (currentLevelText !== newLevelText) {
                ui.updateLevel(player.level);
            }
        }
    }
}
