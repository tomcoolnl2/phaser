import { Socket } from 'socket.io';
import { SpaceShip } from '../shared/models';


export interface GameSocket extends Socket {
    player?: SpaceShip;
    asteroid?: {
        id: string;
    };
}