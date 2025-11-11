export enum PlayerEvent {
    joined = 'player:joined',
    protagonist = 'player:protagonist',
    players = 'player:players',
    quit = 'player:quit',
    hit = 'player:hit',
    pickup = 'player:pickup',
    coordinates = 'player:coordinates',
    authenticate = 'player:authenticate',
}

export enum GameEvent {
    drop = 'game:drop',
}

export enum AsteroidEvent {
    create = 'asteroid:create',
    coordinates = 'asteroid:coordinates',
    destroy = 'asteroid:destroy',
    hit = 'asteroid:hit',
}
