import { ZodType } from 'zod';
import { EventName } from '@shared/events';
import { SocketRequestDTO } from '@shared/dto/SocketRequest.dto';
import { SocketResponseDTO } from '@shared/dto/SocketResponse.dto';
import { SocketRequestSchema, SocketResponseSchema } from '@shared/schema/Socket.schema';
import { GameSocket } from 'server/model';
import { BaseListener } from './BaseListener';

/**
 * Creates a strongly-typed event listener for a Socket.IO event with request/response validation.
 *
 * @template TReq - The request payload type.
 * @template TRes - The response payload type.
 * @param config - Listener configuration object.
 * @param cfg.event - The event name to listen for.
 * @param cfg.requestSchema - Zod schema to validate the request payload, or null to skip validation for this event.
 * @param cfg.responseSchema - Zod schema to validate the response payload, or null to skip validation for this event.
 * @param cfg.log - Whether to enable logging for this listener.
 * @param cfg.handle - The handler function to process the event.
 * @returns An instance of a BaseListener subclass for the event.
 */
export function createListener<TReq, TRes>(config: {
    event: EventName;
    requestSchema?: ZodType | ZodType[] | null;
    responseSchema?: ZodType | null;
    log?: boolean;
    handle: (socket: GameSocket, request: SocketRequestDTO<TReq>) => Promise<SocketResponseDTO<TRes>> | SocketResponseDTO<TRes>;
}) {
    // If schema is explicitly null, skip validation. If undefined, use default.
    const requestSchema = config.requestSchema === undefined ? SocketRequestSchema : config.requestSchema;
    const responseSchema = config.responseSchema === undefined ? SocketResponseSchema : config.responseSchema;
    const log = config.log ?? false;
    return new (class extends BaseListener<TReq, TRes> {
        constructor() {
            super(config.event, requestSchema, responseSchema, log);
        }
        /**
         * Handles the event with validated request and response types.
         * @param socket - The connected game socket.
         * @param request - The validated request DTO.
         * @returns The response DTO or a promise resolving to it.
         */
        protected _handle(socket: GameSocket, request: SocketRequestDTO<TReq>) {
            return config.handle(socket, request);
        }
    })();
}
