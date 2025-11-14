import { z } from 'zod';
import { GameConfig } from '../../shared/config';

/**
 * Zod schema for PlayerDTO validation
 */
export const PlayerSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    x: z.number(),
    y: z.number(),
    spriteKey: z.string().min(1),
    isLocal: z.boolean(),
    level: z.number().int().min(0).max(GameConfig.player.playerMaxLevel).optional(),
});
