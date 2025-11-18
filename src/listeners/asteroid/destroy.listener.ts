import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { AsteroidDTO } from '@shared/dto/Asteroid.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';

/**
 * Listener for the `asteroid:destroy` event from the server.
 *
 * This listener is responsible for handling the removal and cleanup of asteroid entities in the ECS architecture
 * when the server notifies that an asteroid has been destroyed. It calls the AsteroidSystem to handle destruction logic
 * and removes the asteroid entity from the scene's asteroidEntities map.
 *
 * Usage:
 *   new AsteroidDestroyListener(socket, scene);
 *
 * @extends BaseListener<AsteroidDTO>
 */
export class AsteroidDestroyListener extends BaseListener<AsteroidDTO> {
    /**
     * The event name this listener handles (`asteroid:destroy`).
     * Used by the BaseListener for socket registration.
     * @type {string}
     * @protected
     * @static
     */
    protected static event: string = Events.Asteroid.destroy;

    /**
     * Constructs a new AsteroidDestroyListener.
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
     * Handles a validated `asteroid:destroy` event response from the server.
     *
     * This method calls the AsteroidSystem to destroy the asteroid entity and removes it from the asteroidEntities map.
     *
     * @param response - The validated SocketResponseDTOSuccess containing the AsteroidDTO for the destroyed asteroid.
     * @protected
     */
    protected override handle(response: SocketResponseDTOSuccess<AsteroidDTO>) {
        const asteroidDTO = response.dto;
        const asteroidSystem = this.scene.getAsteroidSystem();
        const asteroidEntities = this.scene.getAsteroidEntities();
        asteroidSystem.destroyAsteroidById(asteroidDTO.id);
        asteroidEntities.delete(asteroidDTO.id);
    }
}
