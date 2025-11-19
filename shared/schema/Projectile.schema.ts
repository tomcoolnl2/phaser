import { z } from 'zod';


export type ProjectileSchemaType = z.infer<typeof ProjectileSchema>;

export const ProjectileSchema = z.object({
    type: z.literal('projectile'),
    id: z.string().min(1),
    projectileType: z.enum(['bullet', 'rocket', 'laser', 'plasma', 'mine']),
    x: z.number().refine(Number.isFinite, { message: "'x' must be finite" }),
    y: z.number().refine(Number.isFinite, { message: "'y' must be finite" }),
    directionX: z.number().refine(Number.isFinite, { message: "'directionX' must be finite" }),
    directionY: z.number().refine(Number.isFinite, { message: "'directionY' must be finite" }),
    speed: z.number().refine(Number.isFinite, { message: "'speed' must be finite" }),
    ownerId: z.string().min(1),
});
