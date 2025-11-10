export interface SpaceShip {
    name: string;
    id: string;
    x: number;
    y: number;
    ammo: number;
}

export interface Coordinates {
    x: number;
    y: number;
    r?: number;
}

export interface PlayerUpdate extends Coordinates {
    r: number;
    f: boolean; // firing
    m: boolean; // moving
    a: number; // ammo
}

export interface Player {
    id: string;
    name: string;
    x: number;
    y: number;
    ammo: number;
    player?: {
        id: string;
    };
    coors?: PlayerUpdate;
}

export interface Comet {
    id: string;
    x?: number;
    y?: number;
}

export interface PickupData {
    uuid: string;
    ammo: boolean;
}
