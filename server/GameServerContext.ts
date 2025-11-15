import { GameServer } from "./GameServer";

/**
 * Provides access to the singleton GameServer instance.
 */
export class GameServerContext {
    private static instance: GameServerContext | null = null;

    private constructor(private readonly server: GameServer) {}

    /**
     * Initializes the context with the GameServer instance.
     * Throws if already initialized.
     */
    public static initialize(server: GameServer) {
        if (this.instance) {
            throw new Error("GameServerContext is already initialized");
        }
        this.instance = new GameServerContext(server);
    }

    /**
     * Returns the GameServer instance.
     */
    public static get(): GameServer {
        if (!this.instance) {
            throw new Error("GameServerContext not initialized");
        }
        return this.instance.server;
    }
}