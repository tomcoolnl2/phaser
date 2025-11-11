export var PlayerEvent;
(function (PlayerEvent) {
    PlayerEvent["joined"] = "player:joined";
    PlayerEvent["protagonist"] = "player:protagonist";
    PlayerEvent["players"] = "player:players";
    PlayerEvent["quit"] = "player:quit";
    PlayerEvent["hit"] = "player:hit";
    PlayerEvent["pickup"] = "player:pickup";
    PlayerEvent["coordinates"] = "player:coordinates";
    PlayerEvent["authenticate"] = "player:authenticate";
})(PlayerEvent || (PlayerEvent = {}));
export var GameEvent;
(function (GameEvent) {
    GameEvent["drop"] = "game:drop";
})(GameEvent || (GameEvent = {}));
export var AsteroidEvent;
(function (AsteroidEvent) {
    AsteroidEvent["create"] = "asteroid:create";
    AsteroidEvent["coordinates"] = "asteroid:coordinates";
    AsteroidEvent["destroy"] = "asteroid:destroy";
    AsteroidEvent["hit"] = "asteroid:hit";
})(AsteroidEvent || (AsteroidEvent = {}));
//# sourceMappingURL=events.js.map