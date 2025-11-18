import { describe, it, beforeEach, expect, vi } from 'vitest';
import { PlayerQuitListener } from '@/listeners/player/quit.listener';
import { Socket } from 'socket.io-client';
import { GameScene } from '@/scenes/GameScene';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { EventBus } from '@/listeners/EventBus';

EventBus.initialize();

class MockSocket {
    on = vi.fn();
}

class MockEntityManager {
    removeEntity = vi.fn();
}

class MockGameScene {
    entityManager: MockEntityManager;
    private playerEntities: Map<string, any>;
    constructor(playerEntities: Map<string, any>, entityManager: MockEntityManager) {
        this.playerEntities = playerEntities;
        this.entityManager = entityManager;
    }
    getPlayerEntities() {
        return this.playerEntities;
    }
}

describe('PlayerQuitListener', () => {
    let mockSocket: MockSocket;
    let playerEntities: Map<string, any>;
    let mockEntityManager: MockEntityManager;
    let mockScene: MockGameScene;

    beforeEach(() => {
        mockSocket = new MockSocket();
        playerEntities = new Map();
        mockEntityManager = new MockEntityManager();
        mockScene = new MockGameScene(playerEntities, mockEntityManager);
    });

    it('should remove player entity from map and entityManager if entity exists', () => {
        const playerDTO: PlayerDTO = { id: 'p1' } as PlayerDTO;
        const mockEntity = { id: 'entity1' };
        playerEntities.set('p1', mockEntity);
        const listener = new PlayerQuitListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: playerDTO } as SocketResponseDTOSuccess<PlayerDTO>);
        expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('entity1');
        expect(playerEntities.has('p1')).toBe(false);
    });

    it('should do nothing if entity does not exist', () => {
        const playerDTO: PlayerDTO = { id: 'p2' } as PlayerDTO;
        const listener = new PlayerQuitListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: playerDTO } as SocketResponseDTOSuccess<PlayerDTO>);
        expect(mockEntityManager.removeEntity).not.toHaveBeenCalled();
    });
});
