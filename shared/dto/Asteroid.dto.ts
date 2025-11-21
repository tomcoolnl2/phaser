import { v4 as uuidv4 } from 'uuid';
import { EntityWithHealthDTO } from './Entity.dto';
import { CoordinatesDTO } from './Coordinates.dto';

/**
 * Enum representing available asteroid sizes.
 * Values correspond to short string identifiers used for serialization.
 */
export enum AsteroidSize {
    SMALL = 's',
    MEDIUM = 'm',
    LARGE = 'l',
}

/**
 * Enum describing the reason an asteroid was destroyed or removed.
 */
export enum AsteroidCauseOfDeath {
    /** The asteroid was hit by the player. */
    HIT = 'Hit by Player',

    /** The asteroid moved outside the game boundaries. */
    OFFSCREEN = 'Out of bounds',

    /** The game ended while the asteroid was still active. */
    GAME_ENDED = 'Game Ended',
}

/**
 * Configuration object for creating an {@link AsteroidDTO}.
 */
export interface AsteroidDTOConfig {
    /** X-coordinate of the asteroid in world space. */
    x: number;

    /** Y-coordinate of the asteroid in world space. */
    y: number;

    /** Maximum health value of the asteroid. */
    maxHealth: number;

    /** Size classification of the asteroid. */
    size?: AsteroidSize;

    /** Horizontal velocity component. */
    dx?: number;

    /** Vertical velocity component. */
    dy?: number;

    /** Optional cause of death when the asteroid is removed. */
    causeOfDeath?: AsteroidCauseOfDeath | null;
}

/**
 * Data Transfer Object representing an asteroid entity in the game.
 * Implements {@link EntityWithHealthDTO} for health-related properties.
 */
export class AsteroidDTO extends CoordinatesDTO implements EntityWithHealthDTO {
    /** Constant type identifier for ASTEROID entities. */
    public readonly type: string = 'asteroid';

    /** Unique identifier of the asteroid. */
    public readonly id: string;

    /** Current health of the asteroid. */
    public health: number;

    /** Maximum health of the asteroid. */
    public maxHealth: number;

    /** Size classification of the asteroid. */
    public size?: AsteroidSize;

    /** Horizontal velocity. */
    public dx?: number;

    /** Vertical velocity. */
    public dy?: number;

    /** Reason the asteroid was removed or destroyed. */
    public causeOfDeath?: AsteroidCauseOfDeath | null;

    /**
     * Creates a new AsteroidDTO instance.
     *
     * @param config - Configuration values for initializing the asteroid.
     */
    constructor(config: AsteroidDTOConfig) {
        super({ x: config.x, y: config.y });
        this.id = uuidv4();
        this.health = config.maxHealth;
        this.maxHealth = config.maxHealth;
        this.size = config.size;
        this.dx = config.dx;
        this.dy = config.dy;
        this.causeOfDeath = config.causeOfDeath;
    }
}

/**
 * Properties required to create an {@link AsteroidHitDTO}.
 */
export interface AsteroidHitDTOProps {
    /** The ID of the asteroid being hit. */
    asteroidId: string;

    /** Amount of damage dealt to the asteroid. */
    damage: number;
}

/**
 * Data Transfer Object representing a hit event against an asteroid.
 */
export class AsteroidHitDTO {
    /** Constant type identifier for asteroid hit events. */
    public readonly type: string = 'asteroid-hit';

    /** Identifier of the asteroid that was hit. */
    public asteroidId: string;

    /** Damage inflicted on the asteroid. */
    public damage: number;

    /**
     * Creates a new AsteroidHitDTO instance.
     *
     * @param config - The hit event properties.
     */
    constructor(config: AsteroidHitDTOProps) {
        this.asteroidId = config.asteroidId;
        this.damage = config.damage;
    }
}
