
import { z } from 'zod';
import { PlayerSchema } from './Player.schema';
import { AsteroidSchema, AsteroidHitSchema } from './Asteroid.dto';
import { PickupSchema } from './Pickup.schema';
import { CoordinatesSchema } from './Coordinates.schema';

// Accept Player, Asteroid, Pickup, Coordinates, and AsteroidHit DTOs
const DtoSchema = z.union([
    PlayerSchema,
    AsteroidSchema,
    PickupSchema,
    CoordinatesSchema,
    AsteroidHitSchema,
    z.array(PlayerSchema),
    z.array(AsteroidSchema),
    z.array(PickupSchema),
    z.array(CoordinatesSchema),
    z.array(AsteroidHitSchema),
]);

export const SocketResponseSchema = z.discriminatedUnion('ok', [
    z.object({
        ok: z.literal(true),
        status: z.number().optional(),
        message: z.string().optional(),
        dto: DtoSchema,
    }),
    z.object({
        ok: z.literal(false),
        status: z.number().optional(),
        message: z.string().optional(),
        dto: DtoSchema.optional(),
    }),
]);