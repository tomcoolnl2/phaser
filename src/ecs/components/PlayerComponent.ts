import { Component } from '../Component';

/**
 * Player Component
 * Marks an entity as player-controlled and stores player data
 */
export class PlayerComponent extends Component {
    public playerId: string;
    public playerName: string;
    public isLocal: boolean;
    public score: number = 0;

    constructor(playerId: string, playerName: string, isLocal: boolean = false) {
        super();
        this.playerId = playerId;
        this.playerName = playerName;
        this.isLocal = isLocal;
    }

    addScore(points: number): void {
        this.score += points;
    }
}
