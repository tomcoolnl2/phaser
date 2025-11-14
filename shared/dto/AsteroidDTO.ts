import { z } from 'zod';
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

export const AsteroidDTOSchema = z.object({
    id: z.string().min(1),
    x: z.number().refine(Number.isFinite, { message: "'x' must be finite" }),
    y: z.number().refine(Number.isFinite, { message: "'y' must be finite" }),
    health: z.number().refine(Number.isFinite, { message: "'health' must be finite" }),
});

export type AsteroidDTOSchemaType = z.infer<typeof AsteroidDTOSchema>;

export interface AsteroidHitDTO {
    asteroidId: string;
    damage: number;
}

export const AsteroidHitDTOSchema = z.object({
    asteroidId: z.string().min(1),
    damage: z.number().refine(Number.isFinite, { message: "'damage' must be finite" }),
});

