import { createListener } from '../createListener';
import { Events } from '@shared/events';
import { SignOnDTO } from '@shared/dto/SignOn.dto';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { GameConfig } from '@shared/config';
import { GameServerContext } from '../../GameServerContext';

/**
 * Listener for player sign-on/authentication events.
 *
 * Handles the process of authenticating a new player, sending them the current player list,
 * creating their player entity, sending protagonist info, broadcasting their join to others,
 * and initializing the game if needed.
 *
 * @see createListener
 */
export const PlayerSignOnListener = createListener<SignOnDTO, PlayerDTO[]>({
    event: Events.Player.authenticate,

    log: true,

    /**
     * Handles player authentication and onboarding.
     *
     * @param socket - The connected game socket.
     * @param request - The validated sign-on request DTO.
     * @returns A SocketResponseDTO containing the current list of players.
     */
    async handle(socket, request) {
        const server = GameServerContext.get();
        const signonDTO = request.dto as SignOnDTO;

        // Send existing players to new player
        const playersResponse = { ok: true, dto: server.getAllPlayers() };
        socket.emit(Events.Player.competitors, playersResponse);

        // Create new player
        const windowSize = { x: GameConfig.playArea.width, y: GameConfig.playArea.height };
        server.createPlayer(socket, signonDTO.name, windowSize);

        // Send protagonist info
        const protagonistResponse = { ok: true, dto: socket.player! };
        socket.emit(Events.Player.protagonist, protagonistResponse);

        // Broadcast joined event to other clients
        const joinedResponse = { ok: true, dto: socket.player! };
        socket.broadcast.emit(Events.Player.joined, joinedResponse);

        // Initialize game if needed
        server.gameInitialised(socket);

        // Return current players
        return { ok: true, dto: server.getAllPlayers() };
    },
});
