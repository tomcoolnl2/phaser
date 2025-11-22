import { describe, it, beforeEach, expect, vi, type Mock } from 'vitest';
import { AsteroidCreateListener } from '@/listeners/asteroid/create.listener';
import { Socket } from 'socket.io-client';
import { GameScene } from '@/scenes/GameScene';
import { AsteroidDTO } from '@shared/dto/Asteroid.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { EventBus } from '@/listeners/EventBus';

EventBus.initialize();

class MockSocket {
    on = vi.fn();
}

class MockEntity {
    addComponent = vi.fn(() => this);
    getComponent = vi.fn(() => ({ currentHealth: 100, maxHealth: 100 }));
}

class MockEntityManager {
    createEntity = vi.fn(() => new MockEntity());
}

class MockSprite {
    setOrigin = vi.fn(() => this);
    setCollideWorldBounds = vi.fn(() => this);
    setImmovable = vi.fn(() => this);
    setMaxVelocity = vi.fn(() => this);
    setData = vi.fn(() => this);
    play = vi.fn(() => this);
    setScale = vi.fn(() => this);
}

class MockPhysics {
    add = {
        sprite: vi.fn(() => new MockSprite()),
    };
}

class MockGameScene {
    addAsteroid = vi.fn();
    entityManager = new MockEntityManager();
    physics = new MockPhysics();
    private asteroidEntities = new Map();
    getAsteroidEntities() {
        return this.asteroidEntities;
    }
}

describe('AsteroidCreateListener', () => {
    let mockSocket: MockSocket;
    let mockScene: MockGameScene;

    beforeEach(() => {
        mockSocket = new MockSocket();
        mockScene = new MockGameScene();
    });

    it('should add asteroid entity when valid DTO received', () => {
        // Provide a fully valid AsteroidDTO according to your schema
        const asteroidDTO: AsteroidDTO = {
            id: 'a1',
            x: 10,
            y: 20,
            type: 'asteroid',
            health: 100,
            maxHealth: 100,
        };
        const listener = new AsteroidCreateListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: asteroidDTO } as SocketResponseDTOSuccess<AsteroidDTO>);
        // Assert the entity is added to the asteroidEntities map
        expect(mockScene.getAsteroidEntities().get(asteroidDTO.id)).toBeDefined();
    });
});
