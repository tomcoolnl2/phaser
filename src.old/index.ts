import Phaser from 'phaser';
import { io } from 'socket.io-client';
import { MainScene } from './client/scenes/MainScene';
import { LoginScene } from './client/scenes/login';
import { GameWindow } from './shared/models';

// Initialize socket.io connection
const socket = io();
(window as unknown as GameWindow).socket = socket;

// Phaser 3 game configuration
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'space-shooter',
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
        },
    },
    scene: [LoginScene, MainScene],
};

// Create the game instance
const game = new Phaser.Game(config);

export { socket, game };
