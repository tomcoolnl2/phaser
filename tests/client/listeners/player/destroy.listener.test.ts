import { describe, it, beforeEach, expect, vi } from 'vitest';
import { PlayerDestroyListener } from '@/listeners/player/destroy.listener';
import { Socket } from 'socket.io-client';
import { GameScene } from '@/scenes/GameScene';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { EventBus } from '@/listeners/EventBus';

EventBus.initialize();

class MockSocket {
    on = vi.fn();
}

class MockPlayerSystem {
    destroyPlayerById = vi.fn();
}

class MockGameScene {
    private playerEntities: Map<string, any>;
    private playerSystem: MockPlayerSystem;
    constructor(playerEntities: Map<string, any>, playerSystem: MockPlayerSystem) {
        this.playerEntities = playerEntities;
        this.playerSystem = playerSystem;
    }
    getPlayerEntities() {
        return this.playerEntities;
    }
    getPlayerSystem() {
        return this.playerSystem;
    }
}

describe('PlayerDestroyListener', () => {
    let mockSocket: MockSocket;
    let playerEntities: Map<string, any>;
    let mockPlayerSystem: MockPlayerSystem;
    let mockScene: MockGameScene;

    beforeEach(() => {
        mockSocket = new MockSocket();
        playerEntities = new Map();
        mockPlayerSystem = new MockPlayerSystem();
        mockScene = new MockGameScene(playerEntities, mockPlayerSystem);
    });

    it('should remove player entity and call PlayerSystem if entity exists', () => {
        const playerDTO: PlayerDTO = { id: 'p1' } as PlayerDTO;
        const mockEntity = {};
        playerEntities.set('p1', mockEntity);
        const listener = new PlayerDestroyListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: playerDTO } as SocketResponseDTOSuccess<PlayerDTO>);
        expect(mockPlayerSystem.destroyPlayerById).toHaveBeenCalledWith('p1');
        expect(playerEntities.has('p1')).toBe(false);
    });

    it('should do nothing if entity does not exist', () => {
        const playerDTO: PlayerDTO = { id: 'p2' } as PlayerDTO;
        const listener = new PlayerDestroyListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: playerDTO } as SocketResponseDTOSuccess<PlayerDTO>);
        expect(mockPlayerSystem.destroyPlayerById).not.toHaveBeenCalled();
    });
});
