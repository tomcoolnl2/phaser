import * as Phaser from 'phaser';
import { io, Socket } from 'socket.io-client';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';

/**
 * Main game class that initializes Phaser and Socket.IO connection.
 *
 * This class serves as the entry point for the game application. It:
 * - Establishes a Socket.IO connection to the server
 * - Configures the Phaser game instance (1024x768, arcade physics)
 * - Registers game scenes (BootScene for loading, GameScene for gameplay)
 * - Makes the socket connection available to all scenes via registry
 *
 * @example
 * ```typescript
 * // Typically instantiated once in main.ts
 * const game = new Game();
 * ```
 */
export class Game {
    /** The Phaser game instance */
    private game: Phaser.Game;
    /** Socket.IO connection to the server */
    public socket: Socket;

    /**
     * Creates and initializes the game.
     *
     * Sets up Socket.IO connection, configures Phaser with arcade physics,
     * and registers all game scenes. The socket connection is stored in
     * the game registry for access by any scene.
     */
    constructor() {
        // Initialize socket connection
        this.socket = io();

        // Phaser 3 game configuration
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 1024,
            height: 768,
            parent: 'phaser-game',
            backgroundColor: '#000000',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false,
                },
            },
            scene: [BootScene, GameScene],
        };

        this.game = new Phaser.Game(config);

        // Make socket available to scenes
        this.game.registry.set('socket', this.socket);
    }
}
