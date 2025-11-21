import { createListener } from '../createListener';
import { Events } from '@shared/events';
import { CoordinatesDTO } from '@shared/dto/Coordinates.dto';
import { PlayerDTO } from '@shared/dto/Player.dto';

/**
 * Listener for player coordinates update events.
 * Validates incoming coordinate updates and responds with an updated PlayerDTO.
 * @see createListener
 */
export const PlayerCoordinatesListener = createListener<CoordinatesDTO, PlayerDTO>({
    event: Events.Player.coordinates,
    log: false,

    /**
     * Handles a player coordinates update event.
     *
     * @param socket - The connected game socket.
     * @param request - The validated request DTO containing the coordinates.
     * @returns The response DTO with updated player data.
     */
    async handle(socket, { dto: { x, y } }) {
        socket.player.x = x;
        socket.player.y = y;
        return { ok: true, dto: socket.player };
    },
});
