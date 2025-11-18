import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { PlayerEntityFactory } from '@/ecs/factories/PlayerEntityFactory';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';

/**
 * Listener for the `player:protagonist` event from the server.
 *
 * This listener is responsible for handling the creation and registration of the local player entity
 * in the ECS architecture when the server designates this client as the protagonist (local player).
 * It sets up the player sprite, marks it as local, and adds it to the scene's playerEntities map.
 *
 * Usage:
 *   new PlayerProtagonistListener(socket, scene);
 *
 * @extends BaseListener<PlayerDTO>
 */
export class PlayerProtagonistListener extends BaseListener<PlayerDTO> {
    /**
     * The event name this listener handles (`player:protagonist`).
     * Used by the BaseListener for socket registration.
     * @type {string}
     * @protected
     * @static
     */
    protected static event: string = Events.Player.protagonist;

    /**
     * Enables debug logging for this listener.
     * If true, logs all received and validated events to the console.
     * @type {boolean}
     * @protected
     * @static
     */
    protected static log: boolean = true;

    /**
     * Constructs a new PlayerProtagonistListener.
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
     * Handles a validated `player:protagonist` event response from the server.
     *
     * This method creates the local player entity using the provided PlayerDTO, sets the sprite key,
     * marks the player as local, and registers the entity in the ECS and playerEntities map.
     *
     * @param response - The validated SocketResponseDTOSuccess containing the PlayerDTO for the local player.
     * @protected
     */
    protected override handle(response: SocketResponseDTOSuccess<PlayerDTO>) {
        const playerDTO = response.dto;
        playerDTO.spriteKey = 'shooter-sprite';
        playerDTO.isLocal = true;
        const factory = new PlayerEntityFactory(this.scene);
        const entity = factory.fromDTO(playerDTO);
        const playerEntities = this.scene.getPlayerEntities();
        playerEntities.set(playerDTO.id, entity);
        this.scene.setLocalPlayerId(playerDTO.id);
    }
}
