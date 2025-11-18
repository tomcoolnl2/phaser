import { EntityWithHealthDTO } from './Entity.dto';

export enum AsteroidSize {
    SMALL = 's',
    MEDIUM = 'm',
    LARGE = 'l',
}

export enum AsteroidCauseOfDeath {
    HIT = 'Hit by Player',
    OFFSCREEN = 'Out of bounds',
    GAME_ENDED = 'Game Ended',
}

/**
 * Data Transfer Object representing an asteroid entity in the game.
 * Implements EntityWithHealthDTO for health-related properties.
 */
export class AsteroidDTO implements EntityWithHealthDTO {
    /**
     * The DTO type identifier for asteroids.
     * @type {string}
     */
    public readonly type: string = 'asteroid';

    /**
     * Creates a new AsteroidDTO instance.
     * @param id - Unique identifier for the asteroid
     * @param x - X coordinate of the asteroid
     * @param y - Y coordinate of the asteroid
     * @param health - Current health of the asteroid
     * @param maxHealth - Maximum health of the asteroid
     * @param size - Size of the asteroid (optional)
     * @param dx - X velocity (optional)
     * @param dy - Y velocity (optional)
     * @param causeOfDeath - Cause of death, if destroyed (optional)
     */
    constructor(
        /** Unique identifier for the asteroid */
        public readonly id: string,
        /** X coordinate of the asteroid */
        public x: number,
        /** Y coordinate of the asteroid */
        public y: number,
        /** Current health of the asteroid */
        public health: number,
        /** Maximum health of the asteroid */
        public maxHealth: number,
        /** Size of the asteroid (optional) */
        public size?: AsteroidSize,
        /** X velocity (optional) */
        public dx?: number,
        /** Y velocity (optional) */
        public dy?: number,
        /** Cause of death, if destroyed (optional) */
        public causeOfDeath?: AsteroidCauseOfDeath | null
    ) {}
}

/**
 * Data Transfer Object class for an asteroid hit event.
 */

/**
 * Data Transfer Object representing an asteroid hit event.
 */
export class AsteroidHitDTO {
    /**
     * The DTO type identifier for asteroid hit events.
     * @type {string}
     */
    public readonly type: string = 'asteroid-hit';

    /**
     * Creates a new AsteroidHitDTO instance.
     * @param asteroidId - The ID of the asteroid that was hit
     * @param damage - The amount of damage dealt to the asteroid
     */
    constructor(
        /** The ID of the asteroid that was hit */
        public asteroidId: string,
        /** The amount of damage dealt to the asteroid */
        public damage: number
    ) {}
}
