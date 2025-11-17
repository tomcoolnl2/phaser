import { Component } from '@/ecs/core/Component';

/**
 * ScoreComponent tracks the player's score for pickups and other events.
 */
export class ScoreComponent extends Component {
    
    public score: number = 0;

    constructor(initialScore = 0) {
        super();
        this.score = initialScore;
    }

    public add(points: number) {
        this.score += points;
    }
}
