import { createListener } from "../../listener/createListener";
import { Events } from "@shared/events";
import { PickupDTO } from "@shared/dto/PickupDTO.dto";

/**
 * Listener for player pickup events.
 * Validates incoming requests and responses using Zod schemas, then broadcasts the pickup event to all other clients.
 * @see createListener
 */
export const PickupListener = createListener<PickupDTO, PickupDTO>({
    
    event: Events.Player.pickup,

    /**
     * Handles a player pickup event.
     *
     * @param socket - The connected game socket.
     * @param request - The validated request DTO containing the player data.
     * @returns The response DTO, also broadcast to other clients.
     */
    async handle(socket, request) {
        // request already validated by BaseListener
        const pickup = request.dto as PickupDTO;
        const response = { ok: true, dto: pickup };
        // broadcast to everyone except the sender 
        socket.broadcast.emit(this.event, response);
        return response;
    },
});
