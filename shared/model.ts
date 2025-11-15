export interface WeaponLevelProvider<T = number> {
    level: T;
}

export type TurretLevel = 1 | 2 | 3;

export type PlayerLevel = 1 | 2 | 3 | 4 | 5;

export interface Coordinates {
    x: number;
    y: number;
}
