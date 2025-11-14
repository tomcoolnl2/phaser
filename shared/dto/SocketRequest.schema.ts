// SocketRequestDTO.ts
import { z } from 'zod';

/**
 * Zod schema for SocketRequestDTO
 */
export const SocketRequestSchema = z.object({
  dto: z.unknown(), // Should be refined per usage
  message: z.string().optional(),
});
