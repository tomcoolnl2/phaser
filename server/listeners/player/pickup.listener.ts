import { createListener } from '../createListener';
import { Events } from '@shared/events';
import { PickupType, PickupDTO, AmmoPickupDTO, HealthPickupDTO, CoinPickupDTO } from '@shared/dto/Pickup.dto';
import { ProjectileType } from '@shared/types';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { GameServerContext } from '../../GameServerContext';

/**
 * Listener for player pickup events.
 * Validates incoming requests and responses using Zod schemas, then broadcasts the pickup event to all other clients.
 * @see createListener
 */
export const PickupListener = createListener<AmmoPickupDTO | HealthPickupDTO | CoinPickupDTO, PickupDTO>({
    event: Events.Player.pickup,
    log: true,

    /**
     * Handles a player pickup event.
     *
     * @param socket - The connected game socket.
     * @param request - The validated request DTO containing the player data.
     * @returns The response DTO, also broadcast to other clients.
     */
    async handle(_socket, request) {

        const pickup = request.dto;
        
        let response: SocketResponseDTOSuccess<PickupDTO>;
        if (pickup.type === PickupType.AMMO) {
            response = {
                ok: true,
                dto: {
                    id: pickup.id,
                    type: PickupType.AMMO,
                    amount: pickup.amount,
                    x: pickup.x,
                    y: pickup.y,
                    ammoType: pickup.ammoType ?? ProjectileType.BULLET,
                } as AmmoPickupDTO,
            };
        } else if (pickup.type === PickupType.HEALTH) {
            response = {
                ok: true,
                dto: {
                    id: pickup.id,
                    type: PickupType.HEALTH,
                    amount: pickup.amount,
                    x: pickup.x,
                    y: pickup.y,
                } as HealthPickupDTO,
            };
        } else if (pickup.type === PickupType.COIN) {
            response = {
                ok: true,
                dto: {
                    id: pickup.id,
                    type: PickupType.COIN,
                    x: pickup.x,
                    y: pickup.y,
                    points: (pickup as CoinPickupDTO).points ?? 50,
                } as CoinPickupDTO,
            };
        } else {
            throw new Error('Invalid pickup type');
        }
        
        const server = GameServerContext.get();
        server.broadcastPlayerPickup(response);
        return response;
    },
});
