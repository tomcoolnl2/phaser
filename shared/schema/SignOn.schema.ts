import { z } from 'zod';

/**
 * Zod schema for PlayerDTO validation
 */
export const SignOnSchema = z.object({
    type: z.literal('sign-on'),
    name: z.string().min(1),
    x: z.number(),
    y: z.number(),
});
