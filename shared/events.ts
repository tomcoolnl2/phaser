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

export enum CometEvent {
    create = 'comet:create',
    coordinates = 'comet:coordinates',
    destroy = 'comet:destroy',
    hit = 'comet:hit',
}
