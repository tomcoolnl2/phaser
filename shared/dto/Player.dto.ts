import { GameConfig } from '../../shared/config';
import { Coordinates, PlayerLevel } from '../../shared/model';

/**
 * Data Transfer Object representing a player in the game.
 * Implements Coordinates for position tracking.
 */
export class PlayerDTO {
    //
    public readonly type: string = 'player';

    // Backing field for level property
    private _level: number;

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
     */
    constructor(
        public id: string,
        public name: string,
        public x: number,
        public y: number,
        public spriteKey: string,
        public isLocal: boolean,
        level = GameConfig.player.startingLevel,
        public health = GameConfig.player.startingMaxHealth,
        public maxHealth = GameConfig.player.startingMaxHealth
    ) {
        this._level = level;
    }

    /**
     * The player's current level.
     * @returns {PlayerLevel}
     */
    public get level(): PlayerLevel {
        return this._level as PlayerLevel;
    }

    /**
     * Sets the player's level, clamped to the maximum allowed level.
     * @param {PlayerLevel} val - The new level to set
     */
    public set level(val: PlayerLevel) {
        this._level = Math.max(0, Math.min(val, GameConfig.player.playerMaxLevel)) as PlayerLevel;
    }

    /**
     * The player's current position as coordinates.
     * @returns {Coordinates}
     */
    public get position(): Coordinates {
        return { x: this.x, y: this.y } as Coordinates;
    }
}
