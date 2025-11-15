import { createListener } from '../createListener';
import { Events } from '@shared/events';
import { AsteroidDTO } from '@shared/dto/Asteroid.dto';
import { SocketResponseDTO } from '@shared/dto/SocketResponse.dto';
import { GameServerContext } from '../../GameServerContext';

/**
 * Listener for asteroid destroy events.
 *
 * Handles incoming destroy events from clients, marks the asteroid as destroyed in server state if needed,
 * and broadcasts the destroy event to all other clients.
 *
 * @see createListener
 */
export const AsteroidDestroyListener = createListener<AsteroidDTO, AsteroidDTO>({
    event: Events.Asteroid.destroy,
    log: true,

    /**
     * Handles asteroid destroy event logic.
     *
     * @param socket - The connected game socket.
     * @param request - The validated asteroid destroy request DTO.
     * @returns A SocketResponseDTO containing the asteroid DTO, or an error response if broadcasting fails.
     */
    async handle(socket, request) {
        const server = GameServerContext.get();
        const asteroidDTO = request.dto as AsteroidDTO;

        // Mark asteroid as destroyed using public API
        if (!server.isAsteroidDestroyed(asteroidDTO.id)) {
            server.markAsteroidDestroyed(asteroidDTO.id);
        }

        const response = { ok: true, dto: asteroidDTO };

        try {
            // Broadcast to all other clients (excluding sender)
            socket.broadcast.emit(this.event, response);
            return response;
        } catch (e) {
            const message = e instanceof Error ? e.message : e.toString();
            const errorResponse = { ok: false, dto: asteroidDTO, message };
            socket.broadcast.emit(this.event, errorResponse);
            return errorResponse;
        }
    },
});
