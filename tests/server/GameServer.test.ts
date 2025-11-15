import { describe, it, expect, beforeEach } from 'vitest';
import { GameServer } from '../../server/GameServer';
import { GameServerContext } from '../../server/GameServerContext';

describe('GameServer', () => {
    beforeEach(() => {
        GameServerContext.destroy();
    });

    it('should instantiate without error', () => {
        const server = new GameServer();
        expect(server).toBeInstanceOf(GameServer);
    });

    it('should create a player with valid data', () => {
        const server = new GameServer();
        // Mock socket with minimal shape
        const socket: any = { player: null, id: 'test-id' };
        const playerName = 'TestPlayer';
        const windowSize = { x: 1024, y: 768 };
        server.createPlayer(socket, playerName, windowSize);
        expect(socket.player).toBeDefined();
        expect(socket.player.name).toBe(playerName);
        expect(typeof socket.player.x).toBe('number');
        expect(typeof socket.player.y).toBe('number');
    });

    it('should return all players', () => {
        const server = new GameServer();
        const player = { name: 'Test', id: 'id', x: 1, y: 2, spriteKey: '', isLocal: false, level: 1 };
        (server as any).io.sockets.sockets = new Map([
            ['a', { player }],
            ['b', { player: null }],
            ['c', { player }],
        ]);
        const players = server.getAllPlayers();
        expect(players.length).toBe(2);
        expect(players[0].name).toBe('Test');
    });
});
