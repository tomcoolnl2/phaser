import { ZodType } from 'zod';
import { GameSocket } from 'server/model';
import { EventName } from '@shared/events';
import { SocketRequestDTO } from '@shared/dto/SocketRequest.dto';
import { SocketResponseDTO } from '@shared/dto/SocketResponse.dto';
import { logger } from '../logger';

/**
 * Abstract base class for strongly-typed Socket.IO event listeners with request/response validation.
 *
 * @template TReq - The request payload type.
 * @template TRes - The response payload type.
 */
export abstract class BaseListener<TReq, TRes> {
    /**
     * The actual public handler the server binds. Validates input/output and delegates to _handle.
     *
     * @param socket - The connected game socket.
     * @param req - The validated request DTO.
     * @returns The validated response DTO (possibly async).
     */
    public readonly handle: (socket: GameSocket, req: SocketRequestDTO<TReq>) => Promise<SocketResponseDTO<TRes>>;

    /**
     * Constructs a new BaseListener.
     *
     * @param event - The event name to listen for.
     * @param requestSchema - Zod schema to validate the request payload, or null to skip validation.
     * @param responseSchema - Zod schema to validate the response payload, or null to skip validation.
     * @param log - Whether to enable logging for this listener.
     */
    protected constructor(
        public readonly event: EventName,
        private readonly requestSchema: ZodType | null,
        private readonly responseSchema: ZodType | null,
        private readonly log: boolean
    ) {
        this.event = event;
        this.handle = this._wrappedHandle.bind(this);
    }

    /**
     * Internal handler that validates input/output and delegates to the subclass implementation.
     *
     * @param socket - The connected game socket.
     * @param request - The validated request DTO.
     * @returns The validated response DTO (possibly async).
     */
    private async _wrappedHandle(socket: GameSocket, request: SocketRequestDTO<TReq>): Promise<SocketResponseDTO<TRes>> {
        if (this.log) {
            logger.info({ event: this.event, dto: request.dto }, `Incoming event: ${this.event}`);
        }

        // Validate input if schema is provided
        if (this.requestSchema) {
            this.requestSchema.parse(request);
        }

        // Execute actual handler
        let response: SocketResponseDTO<TRes>;
        try {
            response = await this._handle(socket, request, this.log);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.error({ event: this.event, error: message }, `Error handling event: ${this.event}`);
            throw err;
        }

        // Validate output if schema is provided
        if (this.responseSchema) {
            this.responseSchema.parse(response);
        }
        if (this.log) {
            logger.info({ event: this.event, response: response.dto }, `Event handled successfully: ${this.event}`);
        }
        return response;
    }

    /**
     * Subclass must implement the actual event handler logic.
     *
     * @param socket - The connected game socket.
     * @param request - The validated request DTO.
     * @returns The response DTO or a promise resolving to it.
     */
    protected abstract _handle(socket: GameSocket, request: SocketRequestDTO<TReq>, debug: boolean): Promise<SocketResponseDTO<TRes>> | SocketResponseDTO<TRes>;
}
