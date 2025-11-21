import { GameConfig } from '../../shared/config';
import { Coordinates, PlayerLevel } from '../../shared/model';

/**
 * Data Transfer Object representing a player in the game.
 * Implements Coordinates for position tracking.
 */
export class PlayerDTO {
    //
    public readonly type: string = 'player';

    /**
     * @param id - Unique identifier for the player
     * @param name - Player's display name
     * @param x - X coordinate of the player
     * @param y - Y coordinate of the player
     * @param spriteKey - Key for the player's sprite asset
     * @param isLocal - Whether this player is the local player
     * @param level - Initial level of the player (default: starting level from GameConfig)
     * @param health - Current health of the player (default: starting health from GameConfig)
     * @param maxHealth - Maximum health of the player (default: starting max health from GameConfig)
     * @param angle - The current facing direction of the player in radians (Phaser uses radians for rotation)
     */
    constructor(
        public id: string,
        public name: string,
        public x: number,
        public y: number,
        public spriteKey: string,
        public isLocal: boolean,
        public level = GameConfig.player.startingLevel,
        public health = GameConfig.player.startingMaxHealth,
        public maxHealth = GameConfig.player.startingMaxHealth,
        public angle: number = 0
    ) {}

    /**
     * The player's current position as coordinates.
     * @returns {Coordinates}
     */
    public get position(): Coordinates {
        return { x: this.x, y: this.y } as Coordinates;
    }
}
