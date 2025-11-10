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
export var CometEvent;
(function (CometEvent) {
    CometEvent["create"] = "comet:create";
    CometEvent["coordinates"] = "comet:coordinates";
    CometEvent["destroy"] = "comet:destroy";
    CometEvent["hit"] = "comet:hit";
})(CometEvent || (CometEvent = {}));
//# sourceMappingURL=events.js.map