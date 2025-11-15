import { createListener } from "../../listener/createListener";
import { Events } from "@shared/events";
import { SocketRequestSchema } from "@shared/dto/SocketRequest.schema";
import { SocketResponseSchema } from "@shared/dto/SocketResponse.schema";
import { Coordinates } from "@shared/model";
import { PlayerDTO } from "@shared/dto/Player.dto";

/**
 * Listener for player hit events.
 *
 * Validates incoming requests and responses using Zod schemas, then broadcasts the hit event to all other clients.
 *
 * @see createListener
 */
export const HitListener = createListener<PlayerDTO, PlayerDTO>({
    
    event: Events.Player.hit,
    requestSchema: SocketRequestSchema,
    responseSchema: SocketResponseSchema,

    /**
     * Handles a player hit event.
     *
     * @param socket - The connected game socket.
     * @param request - The validated request DTO containing the player data.
     * @returns The response DTO, also broadcast to other clients.
     */
    async handle(socket, request) {
        // request already validated by BaseListener
        const player = request.dto as PlayerDTO;

        const response = {
            ok: true,
            dto: player,
        };

        // broadcast to everyone except the sender (same behavior as socket.broadcast.emit)
        socket.broadcast.emit(Events.Player.hit, response);

        return response;
    },
});
