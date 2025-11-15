import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { BaseListener } from '../../../server/listeners/BaseListener';
import { EventName } from '@shared/events';
import { GameSocket } from 'server/model';
import { SocketRequestDTO } from '@shared/dto/SocketRequest.dto';

// Dummy types and values for testing
const DummyRequestSchema = z.object({ ok: z.boolean(), dto: z.string() });
const DummyResponseSchema = z.object({ ok: z.boolean(), dto: z.string() });
const DummyEvent = 'dummy:event' as EventName;

class DummyListener extends BaseListener<string, string> {
    constructor() {
        super(DummyEvent, DummyRequestSchema, DummyResponseSchema, false);
    }
    protected async _handle(_socket: GameSocket, request: any) {
        return { ok: true, dto: request.dto };
    }
}

describe('BaseListener', () => {
    it('should validate request and response', async () => {
        const listener = new DummyListener();
        const socket = {} as GameSocket;
        const request = { ok: true, dto: 'test' };
        const response = await listener.handle(socket, request);
        expect(response.ok).toBe(true);
        expect(response.dto).toBe('test');
    });

    it('should throw on invalid request', async () => {
        const listener = new DummyListener();
        const socket = {} as GameSocket;
        const badRequest = { ok: 123, dto: 456 };
        await expect(listener.handle(socket, badRequest as unknown as SocketRequestDTO<string>)).rejects.toThrow();
    });

    it('should throw on invalid response', async () => {
        class BadListener extends DummyListener {
            // Cast the return value to the expected type to satisfy TypeScript
            protected async _handle(_socket: GameSocket, _request: any) {
                return { ok: 'not-boolean', dto: 123 } as unknown as { ok: boolean; dto: any };
            }
        }
        const listener = new BadListener();
        const socket = {} as GameSocket;
        const request = { ok: true, dto: 'test' };
        await expect(listener.handle(socket, request)).rejects.toThrow();
    });
});
