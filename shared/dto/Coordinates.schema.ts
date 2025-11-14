import { z } from 'zod';

export const CoordinatesSchema = z.object({
    x: z.number(),
    y: z.number(),
});
