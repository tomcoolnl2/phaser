export interface WeaponLevelProvider<T = number> {
    level: T;
}

export type TurretLevel = 1 | 2 | 3;

export type PlayerLevel = 1 | 2 | 3 | 4 | 5;

export interface PlayerData {
    name: string;
    level: PlayerLevel;
    ammo: number;
    score: number;
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
}

export interface Player extends Coordinates {
    id: string;
    name: string;
    ammo: number;
    player?: {
        id: string;
    };
    coors?: PlayerUpdate;
}
