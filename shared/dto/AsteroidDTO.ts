import { EntityWithHealthDTO } from './EntityDTO';

export enum AsteroidSize {
    SMALL = 's',
    MEDIUM = 'm',
    LARGE = 'l',
}

export enum AsteroidCauseOfDeath {
    HIT = 'Hit by Player',
    OFFSCREEN = 'Out of bounds',
}

export interface AsteroidDTO extends EntityWithHealthDTO {
    size?: AsteroidSize;
    dx?: number;
    dy?: number;
    causeOfDeath?: AsteroidCauseOfDeath | null;
}
