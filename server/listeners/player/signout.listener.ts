import { createListener } from '../createListener';
import { Events } from '@shared/events';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { SocketResponseDTO } from '@shared/dto/SocketResponse.dto';
import { GameServerContext } from '../../GameServerContext';

/**
 * Listener for player disconnect events.
 *
 * Handles player sign-out by broadcasting quit and updated player list events to all other clients.
 *
 * @see createListener
 */
export const PlayerSignOutListener = createListener<never, PlayerDTO[]>({
    event: Events.Socket.disconnect,
    requestSchema: null, // skip validation for disconnect event
    log: false,

    /**
     * Handles player disconnect logic.
     *
     * @param socket - The connected game socket.
     * @returns A SocketResponseDTO containing the updated list of players, or an error if no player is associated.
     */
    async handle(socket) {
        const player = socket.player;
        if (!player) {
            return { ok: false, dto: [], message: 'No player associated with socket' };
        }

        // Broadcast quit event
        const quitResponse: SocketResponseDTO<PlayerDTO> = { ok: true, dto: player };
        socket.broadcast.emit(Events.Player.quit, quitResponse);

        // Broadcast updated player list
        const server = GameServerContext.get();
        const players = server.getAllPlayers();
        const listResponse: SocketResponseDTO<PlayerDTO[]> = { ok: true, dto: players };
        socket.broadcast.emit(Events.Player.players, listResponse);

        return listResponse;
    },
});
