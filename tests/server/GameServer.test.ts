import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Socket, BroadcastOperator, DefaultEventsMap } from 'socket.io';
import { GameServer } from '../../server/GameServer';
import { GameSocket } from '../../server/model';
import { AsteroidDTO, AsteroidHitDTO } from '../../shared/dto/Asteroid.dto';
import { AmmoPickupDTO, PickupDTO } from '../../shared/dto/Pickup.dto';
import { PickupType } from '../../shared/dto/Pickup.dto';
import { AsteroidEvent } from '@shared/events';
import { PlayerDTO } from '@shared/dto/Player.dto';

// Minimal mock for BroadcastOperator, only mocks emit
function createMockBroadcast(): BroadcastOperator<DefaultEventsMap, unknown> {
    return { emit: vi.fn() } as unknown as BroadcastOperator<DefaultEventsMap, unknown>;
}

describe('GameServer', () => {
    let server: GameServer;

    beforeEach(() => {
        server = new GameServer();
    });

    it('should initialize server and expose start method', () => {
        expect(typeof server.start).toBe('function');
    });

    it('should create a player with random position', () => {
        // Mock socket and player
        const mockSocket: Partial<GameSocket> = {};
        const player = new PlayerDTO('id-1', 'TestPlayer', 0, 0, 'sprite-x', false, 1);
        const windowSize = { x: 800, y: 600 };
        server['createPlayer'](mockSocket as GameSocket, player, windowSize);

        expect(mockSocket.player).toBeDefined();
        expect(typeof mockSocket.player?.x).toBe('number');
        expect(typeof mockSocket.player?.y).toBe('number');
        expect(mockSocket.player?.name).toBe('TestPlayer');
    });

    it('should generate random coordinates', () => {
        const coords = server['generateRandomCoordinates']();

        expect(coords.x).toBeGreaterThanOrEqual(100);
        expect(coords.x).toBeLessThanOrEqual(924);
        expect(coords.y).toBeGreaterThanOrEqual(100);
        expect(coords.y).toBeLessThanOrEqual(668);
    });

    it('should generate random integer in range', () => {
        for (let i = 0; i < 10; i++) {
            const val = server['randomInt'](1, 5);

            expect(val).toBeGreaterThanOrEqual(1);
            expect(val).toBeLessThan(5);
        }
    });

    it('should call attachListeners on socket connection', () => {
        const mockSocket: Partial<GameSocket> = {
            id: 'socket-1',
            on: vi.fn(),
            emit: vi.fn(),
            broadcast: {
                emit: vi.fn(),
                adapter: {},
                rooms: {},
                exceptRooms: {},
                flags: {},
                socketsJoin: () => {},
                socketsLeave: () => {},
                disconnectSockets: () => {},
            } as any,
        };
        (server as GameServer)['io'].emit = vi.fn();
        (server as GameServer)['setupSocketIO']();
        server['attachListeners'](mockSocket as GameSocket);
    });

    it('should handle asteroid hit and destroy', () => {
        const asteroidId = 'ast-1';
        server['healthManager'].setHealth(asteroidId, 1, 1);
        const asteroidDTO: AsteroidDTO = { id: asteroidId, x: 0, y: 0, health: 1, maxHealth: 1 };
        server['asteroidMap'].set(asteroidId, asteroidDTO);
        server['destroyedAsteroids'].delete(asteroidId);
        const mockOn = vi.fn();
        const mockSocket: Partial<GameSocket> = { on: mockOn };
        server['io'].emit = vi.fn();
        server['addAsteroidHitListener'](mockSocket as unknown as Socket);

        const asteroidHitHandler = mockOn.mock.calls[0][1] as (arg: { ok: boolean, dto: AsteroidHitDTO }) => void;
        asteroidHitHandler({
            dto: { asteroidId, damage: 1 },
            ok: false
        });

        // Accept both legacy and DTO shapes for hit event
        const calls = (server['io'].emit as any).mock.calls;
        const hitCall = calls.find(
            ([event, payload]: [string, any]) =>
                event === AsteroidEvent.hit &&
                ((payload && payload.ok === true && payload.dto && payload.dto.asteroidId === asteroidId && payload.dto.damage === 1) ||
                 (payload && payload.asteroidId === asteroidId && payload.damage === 1))
        );
        expect(hitCall).toBeTruthy();
        expect(server['destroyedAsteroids'].has(asteroidId)).toBe(true);
    });

    it('should broadcast player quit on disconnect', () => {
        const mockEmit = vi.fn();
        // Patch the broadcast mock to use our mockEmit
        const mockBroadcast = { emit: mockEmit } as unknown as BroadcastOperator<DefaultEventsMap, unknown>;
        const mockOn = vi.fn();
        const mockSocket: Partial<GameSocket> = {
            player: {
                id: 'player-1', name: 'Test', x: 0, y: 0,
                spriteKey: 'sprite-x',
                isLocal: false,
                level: 1,
                position: { x: 0, y: 0 }
            } as PlayerDTO,
            broadcast: mockBroadcast,
            on: mockOn,
        };

        server['addSignOutListener'](mockSocket as GameSocket);
        const signOutHandler = mockOn.mock.calls[0][1] as () => void;
        signOutHandler();

        expect(mockEmit).toHaveBeenCalledWith(
            expect.stringContaining('quit'),
            expect.objectContaining({
                ok: true,
                dto: expect.objectContaining({
                    id: 'player-1',
                    name: 'Test',
                    spriteKey: 'sprite-x',
                    isLocal: false,
                    level: 1,
                    x: 0,
                    y: 0,
                })
            })
        );
    });

    it('should spawn asteroid and update position', () => {
        vi.useFakeTimers();
        const mockSocket: Partial<GameSocket> = { asteroid: undefined };
        server['hasAsteroid'] = false;
        server['io'].emit = vi.fn();
        server['createAsteroid'](mockSocket as GameSocket, 10);
        vi.runOnlyPendingTimers();

        expect(server['hasAsteroid']).toBe(true);
        expect(mockSocket.asteroid).toBeDefined();
        vi.useRealTimers();
    });
});
function asteroidHitHandler(arg0: { asteroidId: any; damage: number; }) {
    throw new Error('Function not implemented.');
}

