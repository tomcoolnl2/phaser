import { Socket } from 'socket.io';
import { AsteroidDTO } from '@shared/dto/Asteroid.dto';
import { PlayerDTO } from '@shared/dto/Player.dto';

export interface GameSocket extends Socket {
    player: PlayerDTO;
    asteroid?: AsteroidDTO;
}
