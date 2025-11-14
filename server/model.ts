import { Socket } from 'socket.io';
import { PlayerDTO } from '@shared/model';
import { AsteroidDTO } from '@shared/dto/AsteroidDTO';

export interface GameSocket extends Socket {
    player?: PlayerDTO;
    asteroid?: AsteroidDTO;
}
