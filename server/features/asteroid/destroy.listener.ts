import { createListener } from "../../listener/createListener";
import { AsteroidEvent } from "@shared/events";
import { AsteroidDTO } from "@shared/dto/Asteroid.dto";
import { SocketResponseDTO } from "@shared/dto/SocketResponse.dto";
import { GameServerContext } from "../../GameServerContext";

/**
 * Listener for asteroid destroy events.
 *
 * Listens for incoming destroy events from other clients.
 * When a destroy event is received:
 *   - Optionally marks the asteroid as destroyed in server state via a public method
 *   - Broadcasts the destroy event to all other clients
 */
export const AsteroidDestroyListener = createListener<AsteroidDTO, AsteroidDTO>({
    event: AsteroidEvent.destroy,

    async handle(socket, request) {
        const server = GameServerContext.get();
        const asteroidDTO = request.dto as AsteroidDTO;

        // Mark asteroid as destroyed using public API
        if (!server.isAsteroidDestroyed(asteroidDTO.id)) {
            server.markAsteroidDestroyed(asteroidDTO.id);
        }

        const response: SocketResponseDTO<AsteroidDTO> = { ok: true, dto: asteroidDTO };
        
        try {
            // Broadcast to all other clients (excluding sender)
            socket.broadcast.emit(AsteroidEvent.destroy, response);
            return response;
        } catch (e) {
            const message = e instanceof Error ? e.message : e.toString();
            const errorResponse: SocketResponseDTO<AsteroidDTO> = { ok: false, dto: asteroidDTO, message };
            socket.broadcast.emit(AsteroidEvent.destroy, errorResponse);
            return errorResponse;
        }
    },
});
