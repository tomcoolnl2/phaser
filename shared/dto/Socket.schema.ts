import { z } from 'zod';
import { SignOnSchema } from './SignOn.schema';
import { PlayerSchema } from './Player.schema';
import { AsteroidSchema, AsteroidHitSchema } from './Asteroid.schema';
import { PickupSchema } from './Pickup.schema';
import { CoordinatesSchema } from './Coordinates.schema';

export const DtoSchema = z.union([
    SignOnSchema,
    PlayerSchema,
    AsteroidSchema,
    PickupSchema,
    CoordinatesSchema,
    AsteroidHitSchema,
    z.array(SignOnSchema),
    z.array(PlayerSchema),
    z.array(AsteroidSchema),
    z.array(PickupSchema),
    z.array(CoordinatesSchema),
    z.array(AsteroidHitSchema),
]);

const SocketSchema = z.discriminatedUnion('ok', [
    z.object({
        ok: z.literal(true),
        message: z.string().optional(),
        dto: DtoSchema,
    }),
    z.object({
        ok: z.literal(false),
        message: z.string().optional(),
        dto: DtoSchema.optional(),
    }),
]);

export const SocketRequestSchema = SocketSchema;

export const SocketResponseSchema = SocketSchema;
