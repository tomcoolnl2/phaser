import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { PickupDTO } from '@shared/dto/Pickup.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';

/**
 * Listener for the `player:pickup` event from the server.
 *
 * This listener is responsible for handling the removal of a pickup entity in the ECS architecture
 * when the server notifies that a player has collected a pickup. It calls the scene's destroyPickupEntity method
 * to remove the pickup from the game world.
 *
 * Usage:
 *   new PlayerPickupListener(socket, scene);
 *
 * @extends BaseListener<PickupDTO>
 */
export class PlayerPickupListener extends BaseListener<PickupDTO> {
    /**
     * The event name this listener handles (`player:pickup`).
     * Used by the BaseListener for socket registration.
     * @type {string}
     * @protected
     * @static
     */
    protected static event: string = Events.Player.pickup;

    /**
     * Constructs a new PlayerPickupListener.
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
     * Handles a validated `player:pickup` event response from the server.
     *
     * This method removes the pickup entity from the game world when a player collects it.
     *
     * @param response - The validated SocketResponseDTOSuccess containing the PickupDTO for the collected pickup.
     * @protected
     */
    protected override handle({ dto: { id } }: SocketResponseDTOSuccess<PickupDTO>) {
        this.scene.destroyPickupEntity(id);
    }
}
