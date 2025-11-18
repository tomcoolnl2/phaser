import { Events } from '@shared/events';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { GameServerContext } from '../../GameServerContext';
import { createListener } from '../createListener';

/**
 * Listener for player hit events.
 * Validates incoming requests and responses using Zod schemas, then broadcasts the hit event to all other clients.
 * @see createListener
 */
export const PlayerDestroyListener = createListener<PlayerDTO, PlayerDTO>({
    event: Events.Player.destroy,
    log: true,

    /**
     * Handles a player hit event.
     *
     * @param socket - The connected game socket.
     * @param request - The validated request DTO containing the player data.
     * @returns The response DTO, also broadcast to other clients.
     */
    async handle(_socket, { dto }) {
        const response = { ok: true, dto };
        const server = GameServerContext.get();
        server.detonateAllAsteroids();
        return response;
    },
});
