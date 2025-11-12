import { Socket } from 'socket.io';
import { SpaceShip } from '../shared/model';

export interface GameSocket extends Socket {
    player?: SpaceShip;
    asteroid?: {
        id: string;
    };
}
