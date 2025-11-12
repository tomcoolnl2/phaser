import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Socket } from 'socket.io';
import { GameServer } from '../../server/GameServer';
import { HealthManager } from '../../server/HealthManager';
import { GameSocket } from '../../server/model';
import { Player, SpaceShip } from '../../shared/model';
import { AsteroidDTO } from '../../shared/dto/AsteroidDTO';
import { PickupDTO } from '../../shared/dto/PickupDTO';
import { PickupType } from '../../shared/dto/PickupDTO';

type BroadcastOperatorMock = {
    emit: ReturnType<typeof vi.fn>;
    adapter: unknown;
    rooms: unknown;
    exceptRooms: unknown;
    flags: unknown;
    socketsJoin: () => void;
    socketsLeave: () => void;
    disconnectSockets: () => void;
    to?: () => BroadcastOperatorMock;
    in?: () => BroadcastOperatorMock;
    except?: () => BroadcastOperatorMock;
    compress?: () => BroadcastOperatorMock;
    volatile?: BroadcastOperatorMock;
    local?: BroadcastOperatorMock;
    timeout?: (timeout: number) => BroadcastOperatorMock;
    emitWithAck?: () => Promise<unknown>;
    allSockets?: () => Promise<Set<string>>;
    fetchSockets?: () => Promise<unknown>;
};

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
        const player: Player = { id: '', name: 'TestPlayer', x: 0, y: 0, ammo: 0 };
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
        const asteroidDTO: AsteroidDTO = { id: asteroidId, x: 0, y: 0, hp: 1, maxHp: 1 };
        server['asteroidMap'].set(asteroidId, asteroidDTO);
        server['destroyedAsteroids'].delete(asteroidId);
        const mockOn = vi.fn();
        const mockSocket: Partial<GameSocket> = { on: mockOn };
        server['io'].emit = vi.fn();
        server['addAsteroidHitListener'](mockSocket as Socket);

        const asteroidHitHandler = mockOn.mock.calls[0][1] as (id: string) => void;
        asteroidHitHandler(asteroidId);

        expect(server['io'].emit).toHaveBeenCalledWith(expect.stringContaining('hit'), expect.objectContaining({ id: asteroidId }));
        expect(server['io'].emit).toHaveBeenCalledWith(expect.stringContaining('destroy'), expect.objectContaining({ id: asteroidId }));
        expect(server['destroyedAsteroids'].has(asteroidId)).toBe(true);
    });

    it('should broadcast player quit on disconnect', () => {
        const mockEmit = vi.fn();
        const mockOn = vi.fn();
        const mockBroadcast: BroadcastOperatorMock = {
            emit: mockEmit,
            adapter: {},
            rooms: {},
            exceptRooms: {},
            flags: {},
            socketsJoin: () => {},
            socketsLeave: () => {},
            disconnectSockets: () => {},
        };
        const mockSocket: Partial<GameSocket> = {
            player: { id: 'player-1', name: 'Test', x: 0, y: 0, ammo: 0 },
            broadcast: mockBroadcast as any,
            on: mockOn,
        };

        server['addSignOutListener'](mockSocket as GameSocket);
        const signOutHandler = mockOn.mock.calls[0][1] as () => void;
        signOutHandler();

        expect(mockEmit).toHaveBeenCalledWith(expect.stringContaining('quit'), 'player-1');
    });

    it('should update player ammo on pickup', () => {
        const mockEmit = vi.fn();
        const mockOn = vi.fn();
        const mockBroadcast: BroadcastOperatorMock = {
            emit: mockEmit,
            adapter: {},
            rooms: {},
            exceptRooms: {},
            flags: {},
            socketsJoin: () => {},
            socketsLeave: () => {},
            disconnectSockets: () => {},
        };
        const mockSocket: Partial<GameSocket> = {
            player: { id: 'player-1', name: 'Test', x: 0, y: 0, ammo: 0 },
            broadcast: mockBroadcast as any,
            on: mockOn,
        };
        server['addPickupListener'](mockSocket as GameSocket);
        const pickupDTO: PickupDTO = { type: PickupType.AMMO, uuid: 'pickup-1', amount: true };

        const pickupHandler = mockOn.mock.calls[0][1] as (dto: PickupDTO) => void;
        pickupHandler(pickupDTO);

        expect(mockSocket.player?.ammo).toBeGreaterThan(0);
        expect(mockEmit).toHaveBeenCalledWith(expect.stringContaining('pickup'), pickupDTO);
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
