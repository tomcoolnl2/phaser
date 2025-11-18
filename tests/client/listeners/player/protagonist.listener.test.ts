import { describe, it, beforeEach, expect, vi } from 'vitest';
import { PlayerProtagonistListener } from '@/listeners/player/protagonist.listener';
import { Socket } from 'socket.io-client';
import { GameScene } from '@/scenes/GameScene';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { EventBus } from '@/listeners/EventBus';

EventBus.initialize();

class MockSocket {
    on = vi.fn();
}

const mockEntity = {};
const mockFromDTO = vi.fn(() => mockEntity);

vi.mock('@/ecs/factories/PlayerEntityFactory', () => ({
    PlayerEntityFactory: class {
        constructor() {}
        fromDTO = mockFromDTO;
    },
}));

class MockGameScene {
    private playerEntities: Map<string, any>;
    setLocalPlayerId = vi.fn();
    constructor(playerEntities: Map<string, any>) {
        this.playerEntities = playerEntities;
    }
    getPlayerEntities() {
        return this.playerEntities;
    }
}

describe('PlayerProtagonistListener', () => {
    let mockSocket: MockSocket;
    let playerEntities: Map<string, any>;
    let mockScene: MockGameScene;

    beforeEach(() => {
        mockSocket = new MockSocket();
        playerEntities = new Map();
        mockScene = new MockGameScene(playerEntities);
        mockFromDTO.mockClear();
        mockScene.setLocalPlayerId.mockClear();
    });

    it('should create and register the local player entity and set local player id', () => {
        const playerDTO: PlayerDTO = { id: 'local1', name: 'A', x: 0, y: 0 } as PlayerDTO;
        const listener = new PlayerProtagonistListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: playerDTO } as SocketResponseDTOSuccess<PlayerDTO>);
        expect(mockFromDTO).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'local1',
                spriteKey: 'shooter-sprite',
                isLocal: true,
            })
        );
        expect(playerEntities.get('local1')).toBe(mockEntity);
        expect(mockScene.setLocalPlayerId).toHaveBeenCalledWith('local1');
    });
});
