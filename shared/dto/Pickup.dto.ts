import { ProjectileRefillAmount, ProjectileType } from '@shared/types';

export enum PickupType {
    AMMO = 'pickup-ammo',
    HEALTH = 'pickup-health',
    COIN = 'pickup-coin',
}

export type PickupDTO = AmmoPickupDTO | HealthPickupDTO | CoinPickupDTO;

export type CoinPickupDTO = {
    type: PickupType.COIN;
    id: string;
    x: number;
    y: number;
    points: number; // e.g. 50
};

export type AmmoPickupDTO = {
    type: PickupType.AMMO;
    id: string;
    amount: ProjectileRefillAmount;
    x: number;
    y: number;
    ammoType?: ProjectileType;
};

export type HealthPickupDTO = {
    type: PickupType.HEALTH;
    id: string;
    amount: 1 | 2;
    x: number;
    y: number;
};
