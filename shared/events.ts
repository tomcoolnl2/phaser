/**
 * Defines the event names used for communication between the server and clients.
 */
export const Events = {
    Socket: {
        disconnect: 'disconnect',
    },
    Player: {
        joined: 'player:joined',
        protagonist: 'player:protagonist',
        players: 'player:players',
        quit: 'player:quit',
        hit: 'player:hit',
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
    Game: {
        drop: 'game:drop',
    },
} as const;

export type EventTree = typeof Events;

export type EventName = {
    [K in keyof EventTree]: EventTree[K][keyof EventTree[K]];
}[keyof EventTree];
