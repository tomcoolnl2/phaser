import { ZodType } from 'zod';
import { EventBus } from '@/listeners/EventBus';
import { Socket } from 'socket.io-client';
import { SocketResponseDTO, SocketResponseDTOFailure, SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { SocketResponseSchema } from '@shared/schema/Socket.schema';
import { Events } from '@shared/events';

interface ListenerConstructor {
    event: string;
    log?: boolean;
}

/**
 * Abstract base class for client-side Socket.IO event listeners with payload validation and event bus emission.
 *
 * On the client, only the incoming payload (response) needs validation, because listeners only handle
 * events received from the server. Outgoing requests are validated at the call site, not in the listener.
 * This is in contrast to the server, which handles both request and response validation.
 *
 * @template T - The payload type for the event.
 */
export abstract class BaseListener<T> {
    /**
     * Singleton event bus instance for emitting validated events.
     * @protected
     */
    protected readonly eventBus: EventBus = EventBus.getInstance();

    /**
     * The event name this listener handles. Must be set by subclasses.
     * @protected
     */
    protected readonly event: string;

    /**
     * Zod schema for validating the response payload (default: SocketResponseSchema).
     * Use `null` to skip validation.
     * @protected
     */
    protected responseSchema: ZodType<SocketResponseDTO<T>> | null = SocketResponseSchema as ZodType<SocketResponseDTO<T>>;

    /**
     * Enables debug logging for this listener.
     * @protected
     */
    protected log: boolean;

    /**
     * Constructs a new BaseListener and registers the event handler.
     * @param socket - The Socket.IO client instance.
     * @param debug - Whether to enable debug logging (default: false).
     */
    protected constructor(protected readonly socket: Socket) {
        const listenerConstructor = this.constructor as unknown as ListenerConstructor;
        this.event = listenerConstructor.event;
        this.log = this.log = listenerConstructor.log !== false;
        this.bindEventListener();
    }

    private bindEventListener() {
        this.log = false;
        this.socket.on(this.event, (responsePayload: SocketResponseDTO<T>) => {
            if (this.log) {
                this.logMessage('Received event', responsePayload);
            }
            if (this.responseSchema) {
                try {
                    const parsedResponse = this.responseSchema.parse(responsePayload);
                    if (this.log) {
                        this.logMessage('Validated event', parsedResponse);
                    }
                    this.emit(parsedResponse);
                    this.handle(parsedResponse);
                } catch (error) {
                    if (this.log) {
                        this.logMessage('Validation error', error);
                    }
                    this.emit({ ok: false, error } as SocketResponseDTOFailure<T>);
                    this.emitError(error);
                }
            } else {
                if (this.log) {
                    this.logMessage('No schema provided, trusting payload.');
                }
                this.emit({ ok: true, dto: responsePayload.dto } as SocketResponseDTOSuccess<T>);
                this.handle(responsePayload);
            }
        });
    }

    private logMessage(message: string, ...args: unknown[]): void {
        // eslint-disable-next-line no-console
        console.log(`[Listener] [${this.event}] ${message}`, ...args);
    }

    /**
     * Emits the result to the event bus.
     * @param payload - The event payload DTO to emit.
     */
    protected emit(payload: SocketResponseDTO<T>): void {
        this.eventBus.emit<SocketResponseDTO<T>>(this.event, payload);
    }

    /**
     * Emits an error event to the event bus.
     * @param error - The error to emit.
     */
    protected emitError(error: unknown) {
        this.eventBus.emit(Events.Socket.error, { event: this.event, error });
    }

    /**
     * Subclasses must implement this to handle a validated response.
     * @param response - The validated SocketResponseDTO<T>.
     */
    protected abstract handle(response: SocketResponseDTO<T>): void;
}
