import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { createListener } from '../../../server/listeners/createListener';
import { EventName } from '@shared/events';
import { GameSocket } from 'server/model';

const DummyEvent = 'dummy:event' as EventName;
const DummyRequestSchema = z.object({ ok: z.boolean(), dto: z.string() });
const DummyResponseSchema = z.object({ ok: z.boolean(), dto: z.string() });

describe('createListener', () => {
    it('should handle valid request/response', async () => {
        const listener = createListener<string, string>({
            event: DummyEvent,
            requestSchema: DummyRequestSchema,
            responseSchema: DummyResponseSchema,
            handle: async (_socket, request) => ({ ok: true, dto: request.dto }),
        });
        const socket = {} as GameSocket;
        const request = { ok: true, dto: 'hello' };
        const response = await listener.handle(socket, request);
        expect(response.ok).toBe(true);
        expect(response.dto).toBe('hello');
    });

    it('should throw on invalid request', async () => {
        const listener = createListener<string, string>({
            event: DummyEvent,
            requestSchema: DummyRequestSchema,
            responseSchema: DummyResponseSchema,
            handle: async (_socket, request) => ({ ok: true, dto: request.dto }),
        });
        const socket = {} as GameSocket;
        const badRequest = { ok: 123, dto: 456 };
        await expect(listener.handle(socket, badRequest as any)).rejects.toThrow();
    });

    it('should throw on invalid response', async () => {
        const listener = createListener<string, string>({
            event: DummyEvent,
            requestSchema: DummyRequestSchema,
            responseSchema: DummyResponseSchema,
            handle: async (_socket, _request) => ({ ok: 'not-boolean', dto: 123 }) as any,
        });
        const socket = {} as GameSocket;
        const request = { ok: true, dto: 'test' };
        await expect(listener.handle(socket, request)).rejects.toThrow();
    });
});
