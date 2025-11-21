import { z } from 'zod';
import { ProjectileType } from '../types';

export const WeaponSchema = z.object({
    type: z.literal('weapon'),
    id: z.string().min(1),
    level: z.number().int().min(0),
    fireRate: z.number(),
    ammo: z.number().int().min(0),
    ammoType: z.enum(Object.values(ProjectileType) as [string, ...string[]]),
    damage: z.number().min(0),
    maxAmmo: z.number().int().min(0),
    speed: z.number().int().min(0),
});
