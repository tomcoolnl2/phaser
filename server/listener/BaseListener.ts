import { ZodType } from "zod";
import { GameSocket } from "server/model";
import { EventName } from "@shared/events";
import { SocketRequestDTO } from "@shared/dto/SocketRequest.dto";
import { SocketResponseDTO } from "@shared/dto/SocketResponse.dto";

/**
 * Abstract base class for strongly-typed Socket.IO event listeners with request/response validation.
 *
 * @template TReq - The request payload type.
 * @template TRes - The response payload type.
 */
export abstract class BaseListener<TReq, TRes> {
    /**
     * The event name this listener handles.
     */
    public readonly event: EventName;

    /**
     * The actual public handler the server binds. Validates input/output and delegates to _handle.
     *
     * @param socket - The connected game socket.
     * @param req - The validated request DTO.
     * @returns The validated response DTO (possibly async).
     */
    public readonly handle: (
        socket: GameSocket,
        req: SocketRequestDTO<TReq>
    ) => Promise<SocketResponseDTO<TRes>>;

    /**
     * Constructs a new BaseListener.
     *
     * @param event - The event name to listen for.
     * @param requestSchema - Zod schema to validate the request payload.
     * @param responseSchema - Zod schema to validate the response payload.
     */
    protected constructor(
        event: EventName,
        private readonly requestSchema: ZodType,
        private readonly responseSchema: ZodType,
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
    private async _wrappedHandle(
        socket: GameSocket,
        request: SocketRequestDTO<TReq>
    ): Promise<SocketResponseDTO<TRes>> {
        // Validate input
        this.requestSchema.parse(request);

        // Execute actual handler
        const response = await this._handle(socket, request);

        // Validate output
        this.responseSchema.parse(response);

        return response;
    }

    /**
     * Subclass must implement the actual event handler logic.
     *
     * @param socket - The connected game socket.
     * @param request - The validated request DTO.
     * @returns The response DTO or a promise resolving to it.
     */
    protected abstract _handle(
        socket: GameSocket,
        request: SocketRequestDTO<TReq>
    ): Promise<SocketResponseDTO<TRes>> | SocketResponseDTO<TRes>;
}