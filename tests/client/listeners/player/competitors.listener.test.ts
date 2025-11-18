import { describe, it, beforeEach, expect, vi } from 'vitest';
import { PlayerCompetitorsListener } from '@/listeners/player/competitors.listener';
import { Socket } from 'socket.io-client';
import { GameScene } from '@/scenes/GameScene';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { EventBus } from '@/listeners/EventBus';

EventBus.initialize();

class MockSocket {
    on = vi.fn();
}

describe('PlayerCompetitorsListener', () => {
    let mockSocket: MockSocket;
    let playerEntities: Map<string, any>;
    let mockScene: GameScene;

    beforeEach(() => {
        mockSocket = new MockSocket();
        playerEntities = new Map();
        mockScene = {
            getPlayerEntities: () => playerEntities,
            entityManager: {
                createEntity: vi.fn(() => ({
                    addComponent: vi.fn(function () {
                        return this;
                    }),
                })),
            },
            physics: {
                add: {
                    sprite: vi.fn(() => ({
                        setOrigin: vi.fn(function () {
                            return this;
                        }),
                        setCollideWorldBounds: vi.fn(function () {
                            return this;
                        }),
                        setBounce: vi.fn(function () {
                            return this;
                        }),
                        setDamping: vi.fn(function () {
                            return this;
                        }),
                        setDrag: vi.fn(function () {
                            return this;
                        }),
                        setMaxVelocity: vi.fn(function () {
                            return this;
                        }),
                        setData: vi.fn(function () {
                            return this;
                        }),
                        play: vi.fn(function () {
                            return this;
                        }),
                        setAngularDrag: vi.fn(function () {
                            return this;
                        }),
                    })),
                },
            },
        } as unknown as GameScene;
    });

    it('should create and register competitor player entities', () => {
        const competitors: PlayerDTO[] = [
            {
                id: 'p1',
                name: 'A',
                x: 0,
                y: 0,
                type: 'player',
                level: 1,
                maxHealth: 100,
                health: 100,
                spriteKey: '',
                isLocal: false,
            } as PlayerDTO,
            {
                id: 'p2',
                name: 'B',
                x: 1,
                y: 1,
                type: 'player',
                level: 1,
                maxHealth: 100,
                health: 100,
                spriteKey: '',
                isLocal: false,
            } as PlayerDTO,
        ];
        const listener = new PlayerCompetitorsListener(mockSocket as unknown as Socket, mockScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: competitors } as SocketResponseDTOSuccess<PlayerDTO[]>);
        expect(playerEntities.has('p1')).toBe(true);
        expect(playerEntities.has('p2')).toBe(true);
        // Optionally, check that the entity is not undefined
        expect(playerEntities.get('p1')).toBeDefined();
        expect(playerEntities.get('p2')).toBeDefined();
    });
});
