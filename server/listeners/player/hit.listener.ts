import { createListener } from '../createListener';
import { Events } from '@shared/events';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { GameServerContext } from '../../GameServerContext';
import { AsteroidCauseOfDeath } from '@shared/dto/Asteroid.dto';


/**
 * Listener for player hit events.
 * Validates incoming requests and responses using Zod schemas, then broadcasts the hit event to all other clients.
 * @see createListener
 */
export const PlayerHitListener = createListener<PlayerDTO, PlayerDTO>({
    event: Events.Player.hit,
    log: true,

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
        const response = { ok: true, dto: player };
        // broadcast to everyone except the sender (same behavior as socket.broadcast.emit)
        socket.broadcast.emit(this.event, response);
        // Emit player destroy event to all clients (including sender)
        socket.nsp.emit(Events.Player.destroy, response);
        // get all asteroids and end their life
         const server = GameServerContext.get();
         for (const asteroid of server.getAllAsteroids()) {
            // emit to server Events.Asteroid.destroy
            socket.nsp.emit(Events.Asteroid.destroy, { ok: true, dto: asteroid });
         }

        return response;
    },
});
