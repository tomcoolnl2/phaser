import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';

/**
 * Listener for the `player:destroy` event from the server.
 *
 * This listener is responsible for handling the removal and cleanup of a player entity in the ECS architecture
 * when the server notifies that a player has been destroyed. It removes the player entity from the scene's playerEntities map
 * and calls the PlayerSystem to handle any additional destruction logic.
 *
 * Usage:
 *   new PlayerDestroyListener(socket, scene);
 *
 * @extends BaseListener<PlayerDTO>
 */
export class PlayerDestroyListener extends BaseListener<PlayerDTO> {
    /**
     * The event name this listener handles (`player:destroy`).
     * Used by the BaseListener for socket registration.
     * @type {string}
     * @protected
     * @static
     */
    protected static event: string = Events.Player.destroy;

    /**
     * Constructs a new PlayerDestroyListener.
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
     * Handles a validated `player:destroy` event response from the server.
     *
     * This method removes the player entity from the ECS and the playerEntities map
     * when a player is destroyed, and calls the PlayerSystem for additional cleanup.
     *
     * @param response - The validated SocketResponseDTOSuccess containing the PlayerDTO for the destroyed player.
     * @protected
     */
    protected override handle(response: SocketResponseDTOSuccess<PlayerDTO>) {
        const { id } = response.dto as PlayerDTO;
        const playerEntities = this.scene.getPlayerEntities();
        const entity = playerEntities.get(id);
        if (entity) {
            const playerSystem = this.scene.getPlayerSystem();
            playerSystem.destroyPlayerById(id);
            playerEntities.delete(id);
        }
    }
}
