import { describe, it, beforeEach, expect, vi } from 'vitest';
import { AsteroidCoordinatesListener } from '@/listeners/asteroid/coordinates.listener';
import { Socket } from 'socket.io-client';
import { GameScene } from '@/scenes/GameScene';
import { AsteroidDTO } from '@shared/dto/Asteroid.dto';
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
    private asteroidEntities: Map<string, MockEntity>;
    constructor(asteroidEntities: Map<string, MockEntity>) {
        this.asteroidEntities = asteroidEntities;
    }
    getAsteroidEntities() {
        return this.asteroidEntities;
    }
}

describe('AsteroidCoordinatesListener', () => {
    let mockSocket: MockSocket;
    let mockSetPosition: Mock;
    let mockTransform: MockTransform;
    let mockEntity: MockEntity;
    let asteroidEntities: Map<string, MockEntity>;
    let mockScene: MockGameScene;

    beforeEach(() => {
        mockSocket = new MockSocket();
        mockSetPosition = vi.fn();
        mockTransform = new MockTransform();
        mockTransform.sprite.setPosition = mockSetPosition;
        mockEntity = new MockEntity(mockTransform);
        asteroidEntities = new Map();
        mockScene = new MockGameScene(asteroidEntities);
    });

    it('should update asteroid position if entity exists', () => {
        const asteroidDTO: AsteroidDTO = { id: 'a1', x: 100, y: 200 } as AsteroidDTO;
        asteroidEntities.set('a1', mockEntity);
        const listener = new AsteroidCoordinatesListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: asteroidDTO } as SocketResponseDTOSuccess<AsteroidDTO>);
        expect(mockSetPosition).toHaveBeenCalledWith(100, 200);
    });

    it('should do nothing if entity does not exist', () => {
        const asteroidDTO: AsteroidDTO = { id: 'a2', x: 50, y: 60 } as AsteroidDTO;
        const listener = new AsteroidCoordinatesListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: asteroidDTO } as SocketResponseDTOSuccess<AsteroidDTO>);
        expect(mockSetPosition).not.toHaveBeenCalled();
    });
});
