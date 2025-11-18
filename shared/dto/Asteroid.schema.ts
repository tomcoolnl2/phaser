import { z } from 'zod';

export type AsteroidSchemaType = z.infer<typeof AsteroidSchema>;

export const AsteroidSchema = z.object({
    type: z.literal('asteroid'),
    id: z.string().min(1),
    x: z.number().refine(Number.isFinite, { message: "'x' must be finite" }),
    y: z.number().refine(Number.isFinite, { message: "'y' must be finite" }),
    health: z.number().refine(Number.isFinite, { message: "'health' must be finite" }),
});

export const AsteroidHitSchema = z.object({
    type: z.literal('asteroid-hit'),
    asteroidId: z.string().min(1),
    damage: z.number().refine(Number.isFinite, { message: "'damage' must be finite" }),
});
