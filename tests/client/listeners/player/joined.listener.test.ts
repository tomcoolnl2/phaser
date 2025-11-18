import { describe, it, beforeEach, expect, vi, afterEach } from 'vitest';
import { PlayerJoinedListener } from '@/listeners/player/joined.listener';
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
    constructor(playerEntities: Map<string, any>) {
        this.playerEntities = playerEntities;
    }
    getPlayerEntities() {
        return this.playerEntities;
    }
}

describe('PlayerJoinedListener', () => {
    let mockSocket: MockSocket;
    let playerEntities: Map<string, any>;
    let mockScene: MockGameScene;

    beforeEach(() => {
        mockSocket = new MockSocket();
        playerEntities = new Map();
        mockScene = new MockGameScene(playerEntities);
        mockFromDTO.mockClear();
    });

    it('should create and register a new remote player entity', () => {
        const playerDTO: PlayerDTO = { id: 'p1', name: 'A', x: 0, y: 0 } as PlayerDTO;
        const listener = new PlayerJoinedListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: playerDTO } as SocketResponseDTOSuccess<PlayerDTO>);
        expect(mockFromDTO).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'p1',
                spriteKey: 'shooter-sprite-enemy',
                isLocal: false,
            })
        );
        expect(playerEntities.get('p1')).toBe(mockEntity);
    });
});
