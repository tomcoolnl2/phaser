import { createListener } from '../createListener';
import { Events } from '@shared/events';
import { PickupType, PickupDTO, AmmoPickupDTO, HealthPickupDTO } from '@shared/dto/Pickup.dto';

/**
 * Listener for player pickup events.
 * Validates incoming requests and responses using Zod schemas, then broadcasts the pickup event to all other clients.
 * @see createListener
 */
export const PickupListener = createListener<AmmoPickupDTO | HealthPickupDTO, PickupDTO>({
    event: Events.Player.pickup,
    log: true,

    /**
     * Handles a player pickup event.
     *
     * @param socket - The connected game socket.
     * @param request - The validated request DTO containing the player data.
     * @returns The response DTO, also broadcast to other clients.
     */
    async handle(socket, request) {
        const pickup = request.dto;
        if (pickup.type === PickupType.AMMO) {
            const response = {
                ok: true,
                dto: {
                    id: pickup.id,
                    type: PickupType.AMMO,
                    amount: pickup.amount,
                    x: pickup.x,
                    y: pickup.y,
                    ammoType: pickup.ammoType ?? 'bullet',
                } as AmmoPickupDTO,
            };
            socket.broadcast.emit(this.event, response);
            return response;
        }

        if (pickup.type === PickupType.HEALTH) {
            const response = {
                ok: true,
                dto: {
                    id: pickup.id,
                    type: PickupType.HEALTH,
                    amount: pickup.amount,
                    x: pickup.x,
                    y: pickup.y,
                } as HealthPickupDTO,
            };
            socket.broadcast.emit(this.event, response);
            return response;
        }

        throw new Error('Invalid pickup type');
    },
});
