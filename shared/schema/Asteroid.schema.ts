import { z } from 'zod';
import { AsteroidCauseOfDeath, AsteroidSize } from '@shared/dto/Asteroid.dto';

export type AsteroidSchemaType = z.infer<typeof AsteroidSchema>;

export const AsteroidSchema = z.object({
    type: z.literal('asteroid'),
    id: z.string().min(1),
    x: z.number().refine(Number.isFinite, { message: "'x' must be finite" }),
    y: z.number().refine(Number.isFinite, { message: "'y' must be finite" }),
    size: z.enum(AsteroidSize),
    dx: z.number().refine(Number.isFinite, { message: "'dx' must be finite" }).optional(),
    dy: z.number().refine(Number.isFinite, { message: "'dy' must be finite" }).optional(),
    health: z.number().refine(Number.isFinite, { message: "'health' must be finite" }),
    maxHealth: z.number().refine(Number.isFinite, { message: "'maxHealth' must be finite" }),
    collisionRadius: z.number().refine(Number.isFinite, { message: "'collisionRadius' must be finite" }),
    causeOfDeath: z.enum(AsteroidCauseOfDeath).nullable().optional(),
});

export const AsteroidHitSchema = z.object({
    type: z.literal('asteroid-hit'),
    asteroidId: z.string().min(1),
    damage: z.number().refine(Number.isFinite, { message: "'damage' must be finite" }),
});
