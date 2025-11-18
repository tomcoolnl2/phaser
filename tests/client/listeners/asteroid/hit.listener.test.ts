import { describe, it, beforeEach, expect, vi, type Mock } from 'vitest';
import { AsteroidHitListener } from '@/listeners/asteroid/hit.listener';
import { Socket } from 'socket.io-client';
import { GameScene } from '@/scenes/GameScene';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { EventBus } from '@/listeners/EventBus';

EventBus.initialize();

class MockSocket {
    on = vi.fn();
}

class MockAsteroidSystem {
    flashAsteroid = vi.fn();
}

class MockHealthComponent {
    currentHealth = 50;
}

class MockTransformComponent {
    sprite = {};
}

describe('AsteroidHitListener', () => {
    let mockSocket: MockSocket;
    let mockAsteroidSystem: MockAsteroidSystem;
    let asteroidEntities: Map<string, any>;
    let mockScene: GameScene;
    let mockEntity: any;

    beforeEach(() => {
        mockSocket = new MockSocket();
        mockAsteroidSystem = new MockAsteroidSystem();
        asteroidEntities = new Map();
        mockEntity = {
            getComponent: vi.fn(component => {
                if (component.name === 'HealthComponent') return mockEntity.health;
                if (component.name === 'TransformComponent') return mockEntity.transform;
                return undefined;
            }),
            health: new MockHealthComponent(),
            transform: new MockTransformComponent(),
        };
        mockScene = {
            getAsteroidSystem: () => mockAsteroidSystem,
            getAsteroidEntities: () => asteroidEntities,
        } as unknown as GameScene;
    });

    it('should reduce health and flash asteroid if entity exists', () => {
        asteroidEntities.set('a1', mockEntity);
        const listener = new AsteroidHitListener(mockSocket as unknown as Socket, mockScene);
        const response = { dto: { asteroidId: 'a1', damage: 20 } } as SocketResponseDTOSuccess<any>;
        // @ts-expect-error: handle is protected
        listener.handle(response);
        expect(mockEntity.health.currentHealth).toBe(30);
        expect(mockAsteroidSystem.flashAsteroid).toHaveBeenCalledWith(mockEntity.transform.sprite);
    });

    it('should do nothing if entity does not exist', () => {
        const listener = new AsteroidHitListener(mockSocket as unknown as Socket, mockScene);
        const response = { dto: { asteroidId: 'a2', damage: 20 } } as SocketResponseDTOSuccess<any>;
        // @ts-expect-error: handle is protected
        listener.handle(response);
        // No error, no flash, no health change
        expect(mockAsteroidSystem.flashAsteroid).not.toHaveBeenCalled();
    });
});
