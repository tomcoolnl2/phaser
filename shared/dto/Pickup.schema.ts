import { z } from 'zod';
import { PickupType } from './Pickup.dto';

const CoordinatesSchema = {
    x: z.number(),
    y: z.number(),
};

export const AmmoPickupSchema = z.object({
    type: z.literal(PickupType.AMMO),
    id: z.string().min(1),
    amount: z.number().int().min(1),
    ammoType: z.string().optional(),
    ...CoordinatesSchema,
});

export const HealthPickupSchema = z.object({
    type: z.literal(PickupType.HEALTH),
    id: z.string().min(1),
    amount: z.union([z.literal(1), z.literal(2)]),
    ...CoordinatesSchema,
});

export const PickupSchema = z.discriminatedUnion('type', [
    AmmoPickupSchema,
    HealthPickupSchema,
]);
