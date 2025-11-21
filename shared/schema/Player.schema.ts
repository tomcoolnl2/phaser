import { z } from 'zod';
import { GameConfig } from '../config';

/**
 * Zod schema for PlayerDTO validation
 */
export const PlayerSchema = z.object({
    type: z.literal('player'),
    id: z.string().min(1),
    name: z.string().min(1),
    x: z.number(),
    y: z.number(),
    spriteKey: z.string().min(1),
    isLocal: z.boolean(),
    health: z.number().refine(Number.isFinite, { message: "'health' must be finite" }).optional(),
    maxHealth: z.number().refine(Number.isFinite, { message: "'maxHealth' must be finite" }).optional(),
    level: z.number().int().min(0).max(GameConfig.player.playerMaxLevel).optional(),
    angle: z.number().refine(Number.isFinite, { message: "'angle' must be finite" }).optional(),
});
