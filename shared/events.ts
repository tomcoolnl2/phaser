
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
        authenticate: 'player:authenticate',
        joined: 'player:joined',
        protagonist: 'player:protagonist',
        competitors: 'player:competitors',
        coordinates: 'player:coordinates',
        shoot: 'player:shoot',
        hit: 'player:hit',
        destroy: 'player:destroy',
        pickup: 'player:pickup',
        quit: 'player:quit',
    },
    Asteroid: {
        create: 'asteroid:create',
        coordinates: 'asteroid:coordinates',
        destroy: 'asteroid:destroy',
        hit: 'asteroid:hit',
    },
    Projectile: {
        create: 'projectile:create',
        coordinates: 'projectile:coordinates',
        destroy: 'projectile:destroy',
    }
} as const;

export type EventTree = typeof Events;

export type EventName = {
    [K in keyof EventTree]: EventTree[K][keyof EventTree[K]];
}[keyof EventTree];
