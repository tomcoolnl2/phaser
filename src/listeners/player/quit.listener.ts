import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';

/**
 * Listener for the `player:quit` event from the server.
 *
 * This listener is responsible for handling the removal of a player entity from the ECS architecture
 * when a player leaves the game. It removes the player entity from the scene's playerEntities map
 * and the EntityManager.
 *
 * Usage:
 *   new PlayerQuitListener(socket, scene);
 *
 * @extends BaseListener<PlayerDTO>
 */
export class PlayerQuitListener extends BaseListener<PlayerDTO> {
    /**
     * The event name this listener handles (`player:quit`).
     * Used by the BaseListener for socket registration.
     * @type {string}
     * @protected
     * @static
     */
    protected static event: string = Events.Player.quit;

    /**
     * Constructs a new PlayerQuitListener.
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
     * Handles a validated `player:quit` event response from the server.
     *
     * This method removes the player entity from the ECS and the playerEntities map
     * when a player leaves the game.
     *
     * @param response - The validated SocketResponseDTOSuccess containing the PlayerDTO for the quitting player.
     * @protected
     */
    protected override handle(response: SocketResponseDTOSuccess<PlayerDTO>) {
        const playerId = response.dto.id;
        const playerEntities = this.scene.getPlayerEntities();
        const entity = playerEntities.get(playerId);
        if (entity) {
            this.scene.entityManager.removeEntity(entity.id);
            playerEntities.delete(playerId);
        }
    }
}
