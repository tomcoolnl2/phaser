import { GameServer } from './GameServer';

/**
 * Singleton context for accessing the authoritative GameServer instance.
 *
 * Ensures only one GameServer is active at a time and provides global access.
 */
export class GameServerContext {
    private static instance: GameServerContext | null = null;

    /**
     * Private constructor to enforce singleton pattern.
     * @param server - The GameServer instance to store
     */
    private constructor(private readonly server: GameServer) {}

    /**
     * Initializes the context with the GameServer instance.
     * Throws if already initialized.
     * @param server - The GameServer instance to set as singleton
     */
    public static initialize(server: GameServer) {
        if (this.instance) {
            throw new Error('GameServerContext is already initialized');
        }
        this.instance = new GameServerContext(server);
    }

    /**
     * Returns the singleton GameServer instance.
     * @returns The current GameServer instance
     * @throws If the context has not been initialized
     */
    public static get(): GameServer {
        if (!this.instance) {
            throw new Error('GameServerContext not initialized');
        }
        return this.instance.server;
    }

    /**
     * Destroys the singleton context (for testing or shutdown).
     */
    public static destroy() {
        this.instance = null;
    }
}
