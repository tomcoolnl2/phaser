/**
 * Defines the event names used for communication between the server and clients.
 */
export const Events = {
    Socket: {
        error: 'socket:error',
        disconnect: 'disconnect',
    },
    Game: {
        drop: 'game:drop',
    },
    Player: {
        joined: 'player:joined',
        protagonist: 'player:protagonist',
        competitors: 'player:competitors',
        quit: 'player:quit',
        hit: 'player:hit',
        destroy: 'player:destroy',
        pickup: 'player:pickup',
        coordinates: 'player:coordinates',
        authenticate: 'player:authenticate',
    },
    Asteroid: {
        create: 'asteroid:create',
        coordinates: 'asteroid:coordinates',
        destroy: 'asteroid:destroy',
        hit: 'asteroid:hit',
    },
} as const;

export type EventTree = typeof Events;

export type EventName = {
    [K in keyof EventTree]: EventTree[K][keyof EventTree[K]];
}[keyof EventTree];
