/**
 * Type-safe event handler function.
 * @template T - The event payload type.
 */
export type EventHandler<T = unknown> = (payload: T) => void;

/**
 * A simple, type-safe singleton event bus for pub/sub communication.
 *
 * Usage:
 *   EventBus.initialize();
 *   EventBus.getInstance().on<EventPayloadDTO<PlayerDTO>>('playerJoined', handler);
 *   EventBus.getInstance().emit<SocketResponseSchema<PlayerDTO>>('playerJoined', { ok: true, data: player });
 *   EventBus.getInstance().emit<SocketResponseSchema<PlayerDTO>>('playerJoined', { ok: false, error });
 */
export class EventBus {
    /**
     * Map of event names to sets of handler functions.
     */
    private listeners: Map<string, Set<EventHandler<unknown>>> = new Map();

    /**
     * Singleton instance of the EventBus.
     */
    private static instance: EventBus | null = null;

    /**
     * Private constructor to enforce singleton pattern.
     */
    private constructor() {}

    /**
     * Initializes the singleton EventBus instance.
     * Throws if already initialized.
     */
    public static initialize(): void {
        if (this.instance) {
            throw new Error('EventBus is already initialized');
        }
        this.instance = new EventBus();
    }

    /**
     * Returns the singleton EventBus instance.
     * Throws if not yet initialized.
     */
    public static getInstance(): EventBus {
        if (!this.instance) {
            throw new Error('EventBus is not initialized. Call EventBus.initialize() first.');
        }
        return this.instance;
    }

    /**
     * Registers an event handler for a specific event.
     * @param event - The event name.
     * @param handler - The handler function to call when the event is emitted.
     */
    public on<T>(event: string, handler: EventHandler<T>): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler as EventHandler<unknown>);
    }

    /**
     * Unregisters an event handler for a specific event.
     * @param event - The event name.
     * @param handler - The handler function to remove.
     */
    public off<T>(event: string, handler: EventHandler<T>): void {
        this.listeners.get(event)?.delete(handler as EventHandler<unknown>);
    }

    /**
     * Emits an event with a payload to all registered handlers.
     * @param event - The event name.
     * @param payload - The payload to pass to handlers.
     */
    public emit<T>(event: string, payload: T): void {
        this.listeners.get(event)?.forEach(handler => {
            (handler as EventHandler<T>)(payload);
        });
    }

    /**
     * Destroys the singleton context (for testing or shutdown).
     */
    public static destroy(): void {
        this.instance = null;
    }
}
