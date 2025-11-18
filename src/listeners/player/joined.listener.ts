import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { PlayerEntityFactory } from '@/ecs/factories/PlayerEntityFactory';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';

/**
 * Listener for the `player:joined` event from the server.
 *
 * This listener is responsible for handling the creation and registration of new remote player entities
 * in the ECS architecture when another player joins the game. It sets up the player sprite as an enemy,
 * marks it as non-local, and adds it to the scene's playerEntities map.
 *
 * Usage:
 *   new PlayerJoinedListener(socket, scene);
 *
 * @extends BaseListener<PlayerDTO>
 */
export class PlayerJoinedListener extends BaseListener<PlayerDTO> {
    /**
     * The event name this listener handles (`player:joined`).
     * Used by the BaseListener for socket registration.
     * @type {string}
     * @protected
     * @static
     */
    protected static event: string = Events.Player.joined;

    /**
     * Constructs a new PlayerJoinedListener.
     *
     * @param socket - The Socket.IO client instance to listen on.
     * @param scene - The current GameScene instance (used for ECS entity creation and management).
     */
    constructor(
        public readonly socket: Socket,
        private scene: GameScene
    ) {
        super(socket);
    }

    /**
     * Handles a validated `player:joined` event response from the server.
     *
     * This method creates a new remote player entity using the provided PlayerDTO, sets the sprite key
     * to the enemy sprite, marks the player as non-local, and registers the entity in the ECS and
     * playerEntities map.
     *
     * @param response - The validated SocketResponseDTOSuccess containing the PlayerDTO for the joined player.
     * @protected
     */
    protected override handle(response: SocketResponseDTOSuccess<PlayerDTO>) {
        const playerDTO = response.dto;
        playerDTO.spriteKey = 'shooter-sprite-enemy';
        playerDTO.isLocal = false;
        const factory = new PlayerEntityFactory(this.scene);
        const entity = factory.fromDTO(playerDTO);
        const playerEntities = this.scene.getPlayerEntities();
        playerEntities.set(playerDTO.id, entity);
    }
}
