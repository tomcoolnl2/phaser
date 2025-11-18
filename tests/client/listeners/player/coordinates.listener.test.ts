import { describe, it, beforeEach, expect, vi } from 'vitest';
import { PlayerCoordinatesListener } from '@/listeners/player/coordinates.listener';
import { Socket } from 'socket.io-client';
import { GameScene } from '@/scenes/GameScene';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { EventBus } from '@/listeners/EventBus';

EventBus.initialize();

class MockSocket {
    on = vi.fn();
}

import type { Mock } from 'vitest';

class MockTransform {
    sprite: { setPosition: Mock };
    constructor() {
        this.sprite = {
            setPosition: vi.fn(),
        };
    }
}

class MockEntity {
    private transform: MockTransform;
    constructor(transform: MockTransform) {
        this.transform = transform;
    }
    getComponent(_: unknown) {
        return this.transform;
    }
}

class MockGameScene {
    private playerEntities: Map<string, MockEntity>;
    private localPlayerId: string;
    constructor(playerEntities: Map<string, MockEntity>, localPlayerId: string) {
        this.playerEntities = playerEntities;
        this.localPlayerId = localPlayerId;
    }
    getPlayerEntities() {
        return this.playerEntities;
    }
    getLocalPlayerId() {
        return this.localPlayerId;
    }
}

describe('PlayerCoordinatesListener', () => {
    let mockSocket: MockSocket;
    let mockSetPosition: Mock;
    let mockTransform: MockTransform;
    let mockEntity: MockEntity;
    let playerEntities: Map<string, MockEntity>;
    let mockScene: MockGameScene;

    beforeEach(() => {
        mockSocket = new MockSocket();
        mockSetPosition = vi.fn();
        mockTransform = new MockTransform();
        mockTransform.sprite.setPosition = mockSetPosition;
        mockEntity = new MockEntity(mockTransform);
        playerEntities = new Map();
        mockScene = new MockGameScene(playerEntities, 'local1');
    });

    it('should update remote player position if entity exists and not local', () => {
        const playerDTO: PlayerDTO = { id: 'p1', x: 100, y: 200 } as PlayerDTO;
        playerEntities.set('p1', mockEntity);
        const listener = new PlayerCoordinatesListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: playerDTO } as SocketResponseDTOSuccess<PlayerDTO>);
        expect(mockSetPosition).toHaveBeenCalledWith(100, 200);
    });

    it('should do nothing if entity does not exist', () => {
        const playerDTO: PlayerDTO = { id: 'p2', x: 50, y: 60 } as PlayerDTO;
        const listener = new PlayerCoordinatesListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: playerDTO } as SocketResponseDTOSuccess<PlayerDTO>);
        expect(mockSetPosition).not.toHaveBeenCalled();
    });

    it('should skip updating local player', () => {
        const playerDTO: PlayerDTO = { id: 'local1', x: 10, y: 20 } as PlayerDTO;
        playerEntities.set('local1', mockEntity);
        const listener = new PlayerCoordinatesListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: playerDTO } as SocketResponseDTOSuccess<PlayerDTO>);
        expect(mockSetPosition).not.toHaveBeenCalled();
    });
});
