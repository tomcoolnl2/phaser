import { Component } from '../Component';
import type { Level } from '../../../shared/models';

/**
 * Player Component
 * Marks an entity as player-controlled and stores player data
 */
export class PlayerComponent extends Component {
    public playerId: string;
    public playerName: string;
    public isLocal: boolean;
    public level: Level = 1;
    public score: number = 0;

    constructor(playerId: string, playerName: string, isLocal: boolean = false, level: Level = 1) {
        super();
        this.playerId = playerId;
        this.playerName = playerName;
        this.isLocal = isLocal;
        this.level = level;
    }

    setLevel(level: Level): void {
        this.level = level;
    }

    addScore(points: number): void {
        this.score += points;
    }
}
