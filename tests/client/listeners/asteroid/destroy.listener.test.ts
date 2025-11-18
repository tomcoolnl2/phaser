import { describe, it, beforeEach, expect, vi, type Mock } from 'vitest';
import { AsteroidDestroyListener } from '@/listeners/asteroid/destroy.listener';
import { EventBus } from '@/listeners/EventBus';
import { Socket } from 'socket.io-client';
import { GameScene } from '@/scenes/GameScene';
import { AsteroidDTO } from '@shared/dto/Asteroid.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';

class MockSocket {
    on = vi.fn();
}

class MockAsteroidSystem {
    destroyAsteroidById = vi.fn();
}

describe('AsteroidDestroyListener', () => {
    EventBus.initialize();

    let mockSocket: MockSocket;
    let mockAsteroidSystem: MockAsteroidSystem;
    let asteroidEntities: Map<string, object>;
    let mockScene: GameScene;

    beforeEach(() => {
        mockSocket = new MockSocket();
        mockAsteroidSystem = new MockAsteroidSystem();
        asteroidEntities = new Map();
        mockScene = {
            getAsteroidSystem: () => mockAsteroidSystem,
            getAsteroidEntities: () => asteroidEntities,
        } as unknown as GameScene;
    });

    it('should destroy and remove asteroid entity by id', () => {
        const asteroidDTO: AsteroidDTO = { id: 'a1' } as AsteroidDTO;
        const entity = {};
        asteroidEntities.set('a1', entity);
        const listener = new AsteroidDestroyListener(mockSocket as unknown as Socket, mockScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: asteroidDTO } as SocketResponseDTOSuccess<AsteroidDTO>);
        expect(mockAsteroidSystem.destroyAsteroidById).toHaveBeenCalledWith('a1');
        expect(asteroidEntities.has('a1')).toBe(false);
    });

    it('should not throw if entity does not exist', () => {
        const asteroidDTO: AsteroidDTO = { id: 'a2' } as AsteroidDTO;
        const listener = new AsteroidDestroyListener(mockSocket as unknown as Socket, mockScene);
        // @ts-expect-error: handle is protected
        expect(() => listener.handle({ dto: asteroidDTO } as SocketResponseDTOSuccess<AsteroidDTO>)).not.toThrow();
        expect(mockAsteroidSystem.destroyAsteroidById).toHaveBeenCalledWith('a2');
        expect(asteroidEntities.has('a2')).toBe(false);
    });
});
