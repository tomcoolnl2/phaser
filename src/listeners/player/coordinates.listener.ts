import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';
import { TransformComponent } from '@/ecs/components/TransformComponent';

/**
 * Listener for the `player:coordinates` event from the server.
 *
 * This listener is responsible for updating the position of remote player entities in the ECS architecture
 * when the server sends updated coordinates for a player. It skips the local player (whose position is controlled locally)
 * and updates the sprite position for remote players in the scene's playerEntities map.
 *
 * Usage:
 *   new PlayerCoordinatestListener(socket, scene);
 *
 * @extends BaseListener<PlayerDTO>
 */
export class PlayerCoordinatesListener extends BaseListener<PlayerDTO> {
    /**
     * The event name this listener handles (`player:coordinates`).
     * Used by the BaseListener for socket registration.
     * @type {string}
     * @protected
     * @static
     */
    protected static event: string = Events.Asteroid.coordinates;

    /**
     * The response schema for validating the event payload. Set to null to skip validation.
     * @type {null}
     * @protected
     * @static
     */
    protected static responseSchema: null = null;

    /**
     * Enables debug logging for this listener. Set to false to disable logging.
     * @type {boolean}
     * @protected
     * @static
     */
    protected static log: boolean = false;
    /**
     * Constructs a new PlayerCoordinatestListener.
     *
     * @param socket - The Socket.IO client instance to listen on.
     * @param scene - The current GameScene instance (used for ECS entity management).
     */
    constructor(
        public readonly socket: Socket,
        private scene: GameScene
    ) {
        super(socket);
    }

    /**
     * Handles a validated `player:coordinates` event response from the server.
     *
     * This method updates the position of a remote player entity in the ECS when the server sends new coordinates.
     * The local player is skipped, as its position is managed locally.
     *
     * @param response - The validated SocketResponseDTOSuccess containing the PlayerDTO with updated coordinates.
     * @protected
     */
    protected override handle(response: SocketResponseDTOSuccess<PlayerDTO>) {
        const { id, x, y } = response.dto;
        // Skip local player (we control them locally)
        if (id === this.scene.getLocalPlayerId()) {
            return;
        }
        const playerEntities = this.scene.getPlayerEntities();
        const entity = playerEntities.get(id);
        if (entity) {
            const transform = entity.getComponent(TransformComponent);
            if (transform) {
                transform.sprite.setPosition(x, y);
            }
        }
    }
}
