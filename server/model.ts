import { Socket } from 'socket.io';
import { PlayerDTO } from '@shared/dto/Player.dto';

export interface GameSocket extends Socket {
    player: PlayerDTO;
}
