import type { PlayerLevel, WeaponLevelProvider } from '@shared/model';
import { Component } from '@/ecs/core/Component';
import { GameConfig } from '@shared/config';

/**
 * PlayerComponent - Marks an entity as a player and stores player-specific data.
 *
 * This component identifies player entities and stores player metadata like ID,
 * name, level, and score. The `isLocal` flag distinguishes the local player
 * (controlled by this client) from remote players (controlled by other clients).
 *
 * @example
 * ```typescript
 * const playerComp = new PlayerComponent(
 *     'player-123',
 *     'Alice',
 *     true,  // isLocal
 *     1      // starting level
 * );
 *
 * playerComp.setLevel(2);
 * playerComp.addScore(100);
 * ```
 */
/**
 * PlayerComponent - Marks an entity as a player and stores player-specific data.
 *
 * Identifies player entities and stores player metadata like ID, name, level, and score.
 * The `isLocal` flag distinguishes the local player (controlled by this client) from remote players.
 */
export class PlayerComponent extends Component implements WeaponLevelProvider<PlayerLevel> {
    /**
     * Current player score.
     * @private
     */
    private _score: number = 0;

    /**
     * Creates a new PlayerComponent.
     * @param playerId - Unique player identifier
     * @param playerName - Display name
     * @param isLocal - True if this is the local player
     * @param level - Starting level (1-5)
     */
    constructor(
        /** Unique player identifier */
        public playerId: string,
        /** Display name for the player */
        public playerName: string,
        /** True if this is the local player */
        public isLocal = false,
        /** Starting level (1-5) */
        private _level = GameConfig.player.startingLevel as PlayerLevel
    ) {
        super();
    }

    /**
     * Gets the player's current level.
     * @returns The current player level (1-5)
     */
    public get level(): PlayerLevel {
        return this._level;
    }

    /**
     * Updates the player's level, clamped to the maximum allowed.
     * @param level - New level (1-5)
     */
    public set level(level: PlayerLevel) {
        this._level = Math.min(level, GameConfig.player.playerMaxLevel) as PlayerLevel;
    }

    /**
     * Gets the player's current score.
     * @returns The current score
     */
    public get score(): number {
        return this._score;
    }

    /**
     * Sets the player's score.
     * @param score - New score value
     */
    public set score(score: number) {
        this._score = score;
    }

    /**
     * Adds to the player's score.
     * @param amount - Amount to add to the score
     */
    public addScore(amount: number): void {
        this._score += amount;
    }
}
