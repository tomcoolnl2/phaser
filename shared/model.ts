/**
 * EntityBounds - Defines the rectangular bounds for play area or entity checks.
 */
export type EntityBounds = {
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
};

export type Level = 1 | 2 | 3 | 4 | 5;

export interface PlayerData {
    name: string;
    level: Level;
    ammo: number;
    score: number;
}
export interface SpaceShip {
    name: string;
    id: string;
    x: number;
    y: number;
    ammo: number;
    level?: Level;
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
