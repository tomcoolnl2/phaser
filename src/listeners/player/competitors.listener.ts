import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { PlayerEntityFactory } from '@/ecs/factories/PlayerEntityFactory';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';

/**
 * Listener for the `player:competitors` event from the server.
 *
 * This listener is responsible for handling the creation and registration of all competitor (remote) player entities
 * in the ECS architecture when the server sends the list of competitors. It sets up each player sprite as an enemy,
 * marks them as non-local, and adds them to the scene's playerEntities map.
 *
 * Usage:
 *   new PlayerCompetitorsListener(socket, scene);
 *
 * @extends BaseListener<PlayerDTO[]>
 */
export class PlayerCompetitorsListener extends BaseListener<PlayerDTO[]> {
    /**
     * The event name this listener handles (`player:competitors`).
     * Used by the BaseListener for socket registration.
     * @type {string}
     * @protected
     * @static
     */
    protected static event: string = Events.Player.competitors;

    /**
     * Constructs a new PlayerCompetitorsListener.
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
     * Handles a validated `player:competitors` event response from the server.
     *
     * This method creates and registers all remote player entities using the provided PlayerDTO array,
     * sets the sprite key to the enemy sprite, marks each as non-local, and registers them in the ECS and playerEntities map.
     *
     * @param response - The validated SocketResponseDTOSuccess containing the PlayerDTO array for the competitors.
     * @protected
     */
    protected override handle(response: SocketResponseDTOSuccess<PlayerDTO[]>) {
        const players = response.dto as PlayerDTO[];
        const factory = new PlayerEntityFactory(this.scene);
        players.forEach(playerDTO => {
            playerDTO.spriteKey = 'shooter-sprite-enemy';
            playerDTO.isLocal = false;
            const entity = factory.fromDTO(playerDTO);
            const playerEntities = this.scene.getPlayerEntities();
            playerEntities.set(playerDTO.id, entity);
        });
    }
}
