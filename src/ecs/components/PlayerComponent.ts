import { Component } from '../core/Component';
import type { Level } from '../../../shared/model';

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
export class PlayerComponent extends Component {
    /** Unique identifier for this player */
    public playerId: string;

    /** Display name of the player */
    public playerName: string;

    /** Whether this is the local player (controlled by this client) */
    public isLocal: boolean;

    /** Current player level (1-5) */
    public level: Level = 1;

    /** Current player score */
    public score: number = 0;

    /**
     * Creates a new PlayerComponent.
     * @param playerId - Unique player identifier
     * @param playerName - Display name
     * @param isLocal - True if this is the local player
     * @param level - Starting level (1-5)
     */
    constructor(playerId: string, playerName: string, isLocal: boolean = false, level: Level = 1) {
        super();
        this.playerId = playerId;
        this.playerName = playerName;
        this.isLocal = isLocal;
        this.level = level;
    }

    /**
     * Updates the player's level.
     * @param level - New level (1-5)
     */
    public setLevel(level: Level): void {
        this.level = level;
    }

    /**
     * Adds points to the player's score.
     * @param points - Points to add
     */
    public addScore(points: number): void {
        this.score += points;
    }
}
