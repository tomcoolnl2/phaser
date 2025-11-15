import { describe, it, expect, beforeEach } from 'vitest';
import { GameServerContext } from '../../server/GameServerContext';

class DummyServer {}

describe('GameServerContext', () => {
    beforeEach(() => {
        GameServerContext.destroy();
    });

    it('should initialize and get the server', () => {
        const server = new DummyServer() as any;
        GameServerContext.initialize(server);
        expect(GameServerContext.get()).toBe(server);
    });

    it('should throw if initialized twice', () => {
        const server = new DummyServer() as any;
        GameServerContext.initialize(server);
        expect(() => GameServerContext.initialize(server)).toThrowError('GameServerContext is already initialized');
    });

    it('should throw if get is called before initialize', () => {
        expect(() => GameServerContext.get()).toThrowError('GameServerContext not initialized');
    });
});
