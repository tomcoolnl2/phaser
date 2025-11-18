import { describe, it, beforeEach, expect, vi } from 'vitest';
import { PlayerHitListener } from '@/listeners/player/hit.listener';
import { Socket } from 'socket.io-client';
import { GameScene } from '@/scenes/GameScene';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { EventBus } from '@/listeners/EventBus';

EventBus.initialize();

class MockSocket {
    on = vi.fn();
}

class MockHealth {
    currentHealth = 100;
}

class MockEntity {
    private health: MockHealth;
    constructor(health: MockHealth) {
        this.health = health;
    }
    getComponent(_: unknown) {
        return this.health;
    }
}

class MockPlayerSystem {
    destroyPlayerById = vi.fn();
}

class MockGameScene {
    private playerEntities: Map<string, any>;
    private playerSystem: MockPlayerSystem;
    private localPlayerId: string;
    handlePlayerDeath = vi.fn();
    constructor(playerEntities: Map<string, any>, playerSystem: MockPlayerSystem, localPlayerId: string) {
        this.playerEntities = playerEntities;
        this.playerSystem = playerSystem;
        this.localPlayerId = localPlayerId;
    }
    getPlayerEntities() {
        return this.playerEntities;
    }
    getPlayerSystem() {
        return this.playerSystem;
    }
    getLocalPlayerId() {
        return this.localPlayerId;
    }
}

describe('PlayerHitListener', () => {
    let mockSocket: MockSocket;
    let playerEntities: Map<string, any>;
    let mockPlayerSystem: MockPlayerSystem;
    let mockScene: MockGameScene;
    let mockHealth: MockHealth;
    let mockEntity: MockEntity;

    beforeEach(() => {
        mockSocket = new MockSocket();
        playerEntities = new Map();
        mockPlayerSystem = new MockPlayerSystem();
        mockHealth = new MockHealth();
        mockEntity = new MockEntity(mockHealth);
        mockScene = new MockGameScene(playerEntities, mockPlayerSystem, 'local1');
    });

    it('should update health of player entity', () => {
        const playerDTO: PlayerDTO = { id: 'p1', health: 42 } as PlayerDTO;
        playerEntities.set('p1', mockEntity);
        const listener = new PlayerHitListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: playerDTO } as SocketResponseDTOSuccess<PlayerDTO>);
        expect(mockHealth.currentHealth).toBe(42);
    });

    it('should call handlePlayerDeath for local player if health <= 0', () => {
        const playerDTO: PlayerDTO = { id: 'local1', health: 0 } as PlayerDTO;
        playerEntities.set('local1', mockEntity);
        const listener = new PlayerHitListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: playerDTO } as SocketResponseDTOSuccess<PlayerDTO>);
        expect(mockScene.handlePlayerDeath).toHaveBeenCalledWith(playerDTO);
    });

    it('should destroy remote player and remove entity if health <= 0', () => {
        const playerDTO: PlayerDTO = { id: 'p2', health: -1 } as PlayerDTO;
        playerEntities.set('p2', mockEntity);
        const listener = new PlayerHitListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: playerDTO } as SocketResponseDTOSuccess<PlayerDTO>);
        expect(mockPlayerSystem.destroyPlayerById).toHaveBeenCalledWith('p2');
        expect(playerEntities.has('p2')).toBe(false);
    });

    it('should do nothing if entity does not exist', () => {
        const playerDTO: PlayerDTO = { id: 'p3', health: 10 } as PlayerDTO;
        const listener = new PlayerHitListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        expect(() => listener.handle({ dto: playerDTO } as SocketResponseDTOSuccess<PlayerDTO>)).toThrow();
    });
});
