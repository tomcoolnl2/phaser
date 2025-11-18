import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';
import { HealthComponent } from '@/ecs/components/HealthComponent';

/**
 * Listener for the `player:hit` event from the server.
 *
 * This listener is responsible for updating the health of a player entity in the ECS architecture
 * when the server notifies that a player has been hit. If the player's health drops to zero or below,
 * it triggers the appropriate death handling for local or remote players.
 *
 * Usage:
 *   new PlayerHitListener(socket, scene);
 *
 * @extends BaseListener<PlayerDTO>
 */
export class PlayerHitListener extends BaseListener<PlayerDTO> {
    /**
     * The event name this listener handles (`player:hit`).
     * Used by the BaseListener for socket registration.
     * @type {string}
     * @protected
     * @static
     */
    protected static event: string = Events.Player.hit;

    /**
     * Constructs a new PlayerHitListener.
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
     * Handles a validated `player:hit` event response from the server.
     *
     * This method updates the health of the player entity. If the player's health drops to zero or below,
     * it triggers death handling for the local player or removes the remote player entity.
     *
     * @param response - The validated SocketResponseDTOSuccess containing the PlayerDTO for the hit player.
     * @protected
     */
    protected override handle(response: SocketResponseDTOSuccess<PlayerDTO>) {
        const player = response.dto as PlayerDTO;
        const playerEntities = this.scene.getPlayerEntities();
        const entity = playerEntities.get(player.id)!;
        const health = entity.getComponent(HealthComponent)!;
        health.currentHealth = player.health;
        if (entity && health.currentHealth <= 0) {
            if (player.id === this.scene.getLocalPlayerId()) {
                this.scene.handlePlayerDeath(player);
            } else {
                // Remote player died - play death animation and cleanup via PlayerSystem
                const playerSystem = this.scene.getPlayerSystem();
                playerSystem.destroyPlayerById(player.id);
                playerEntities.delete(player.id);
            }
        }
    }
}
