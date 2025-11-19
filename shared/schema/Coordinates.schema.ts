import { z } from 'zod';

export const CoordinatesSchema = z.object({
    type: z.literal('coordinates'),
    x: z.number(),
    y: z.number(),
});
