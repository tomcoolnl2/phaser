import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { AsteroidDTO } from '@shared/dto/Asteroid.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';

/**
 * Listener for the `asteroid:coordinates` event from the server.
 *
 * This listener is responsible for updating the position of asteroid entities in the ECS architecture
 * when the server sends updated coordinates for an asteroid. It updates the sprite position for the asteroid
 * in the scene's asteroidEntities map.
 *
 * Usage:
 *   new AsteroidCoordinatesListener(socket, scene);
 *
 * @extends BaseListener<AsteroidDTO>
 */
export class AsteroidCoordinatesListener extends BaseListener<AsteroidDTO> {
    /**
     * The event name this listener handles (`asteroid:coordinates`).
     * Used by the BaseListener for socket registration.
     * @type {string}
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
     * @static
     */
    protected static log: boolean = false;

    /**
     * Constructs a new AsteroidCoordinatesListener.
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
     * Handles a validated `asteroid:coordinates` event response from the server.
     *
     * This method updates the position of an asteroid entity in the ECS when the server sends new coordinates.
     *
     * @param response - The validated SocketResponseDTOSuccess containing the AsteroidDTO with updated coordinates.
     * @protected
     */
    protected override handle(response: SocketResponseDTOSuccess<AsteroidDTO>) {
        const asteroidDTO = response.dto;
        const asteroidEntities = this.scene.getAsteroidEntities();
        const entity = asteroidEntities.get(asteroidDTO.id);
        if (entity) {
            const transform = entity.getComponent(TransformComponent);
            if (transform) {
                transform.sprite.setPosition(asteroidDTO.x, asteroidDTO.y);
            }
        }
    }
}
