import Phaser from 'phaser';
import { io, Socket } from 'socket.io-client';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';

export class Game {
    private game: Phaser.Game;
    public socket: Socket;

    constructor() {
        // Initialize socket connection
        this.socket = io();

        // Phaser 3 game configuration
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 1024,
            height: 768,
            parent: 'game-container',
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
