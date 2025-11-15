import { createListener } from "../../listener/createListener";
import { Events } from "@shared/events";
import { SocketRequestSchema } from "@shared/dto/SocketRequest.schema";
import { SocketResponseSchema } from "@shared/dto/SocketResponse.schema";
import { Coordinates } from "@shared/model";
import { PlayerDTO } from "@shared/dto/Player.dto";

/**
 * Listener for player coordinates update events.
 * Validates incoming coordinate updates and responds with an updated PlayerDTO.
 * @see createListener
 */
export const PlayerCoordinatesListener = createListener<Coordinates, PlayerDTO>({
    
    event: Events.Player.coordinates,
    
    /**
     * Handles a player coordinates update event.
     *
     * @param socket - The connected game socket.
     * @param request - The validated request DTO containing the coordinates.
     * @returns The response DTO with updated player data.
     */
    async handle(socket, request) {
        const { x, y } = request.dto as Coordinates;
        const { id, name, spriteKey, isLocal, level } = socket.player;
        const dto = new PlayerDTO(id, name, x, y, spriteKey, isLocal, level);
        return { ok: true, dto };
    },
});
