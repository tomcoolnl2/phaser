import { Component } from '@/ecs/core/Component';

/**
 * ScoreComponent tracks the player's score for pickups, asteroid hits, and other events.
 *
 * Attach this component to a player entity to accumulate and manage their score.
 * The score can be incremented by calling the {@link add} method.
 *
 * @example
 * const scoreComponent = new ScoreComponent();
 * scoreComponent.add(100);
 * console.log(scoreComponent.score); // 100
 */
export class ScoreComponent extends Component {
    /**
     * The current score for the entity.
     */
    public score: number = 0;

    /**
     * Creates a new ScoreComponent.
     *
     * @param initialScore - The initial score value (default is 0).
     */
    constructor(initialScore = 0) {
        super();
        this.score = initialScore;
    }

    /**
     * Adds points to the current score.
     *
     * @param points - The number of points to add to the score.
     */
    public add(points: number) {
        this.score += points;
    }
}
