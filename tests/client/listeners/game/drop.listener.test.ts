import { describe, it, beforeEach, expect, vi } from 'vitest';
import { GameDropListener } from '@/listeners/game/drop.listener';
import { Socket } from 'socket.io-client';
import { GameScene } from '@/scenes/GameScene';
import { PickupDTO, PickupType } from '@shared/dto/Pickup.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { EventBus } from '@/listeners/EventBus';

EventBus.initialize();

class MockSocket {
    on = vi.fn();
}

class MockEntityManager {
    removeEntity = vi.fn();
    createEntity = vi.fn(() => new MockEntity('created'));
}

class MockSprite {
    setOrigin = vi.fn(() => this);
    play = vi.fn(() => this);
    destroy = vi.fn();
}

class MockPhysics {
    add = {
        sprite: vi.fn(() => new MockSprite()),
    };
}

class MockTransform {
    sprite = { destroy: vi.fn() };
}

class MockEntity {
    id: string;
    constructor(id: string) {
        this.id = id;
    }
    getComponent = vi.fn(comp => (comp.name === 'TransformComponent' ? new MockTransform() : undefined));
    addComponent = vi.fn(() => this);
}

describe('GameDropListener', () => {
    let mockSocket: MockSocket;
    let pickupEntities: Map<string, MockEntity>;
    let mockScene: GameScene;
    let mockEntityManager: MockEntityManager;
    let mockPhysics: MockPhysics;

    beforeEach(() => {
        mockSocket = new MockSocket();
        pickupEntities = new Map();
        mockEntityManager = new MockEntityManager();
        mockPhysics = new MockPhysics();
        mockScene = {
            getPickupEntities: () => pickupEntities,
            entityManager: mockEntityManager,
            physics: mockPhysics,
        } as unknown as GameScene;
    });

    it('should remove existing pickup and add new one', () => {
        const dto = { id: 'p1', type: PickupType.COIN, x: 0, y: 0, points: 5 } as PickupDTO;
        const existing = new MockEntity('p1');
        pickupEntities.set('p1', existing);
        const listener = new GameDropListener(mockSocket as unknown as Socket, mockScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto } as SocketResponseDTOSuccess<PickupDTO>);
        expect(existing.getComponent).toHaveBeenCalled();
        expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('p1');
        expect(pickupEntities.has('p1')).toBe(true);
    });

    it('should add new pickup if none exists', () => {
        const dto: PickupDTO = { id: 'p2', type: PickupType.COIN, x: 0, y: 0, points: 5 } as PickupDTO;
        const listener = new GameDropListener(mockSocket as unknown as Socket, mockScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto } as SocketResponseDTOSuccess<PickupDTO>);
        expect(pickupEntities.has('p2')).toBe(true);
    });
});
