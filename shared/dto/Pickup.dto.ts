import { AmmoAmount, AmmoType } from '@shared/types';

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
    amount: AmmoAmount;
    x: number;
    y: number;
    ammoType?: AmmoType;
};

export type HealthPickupDTO = {
    type: PickupType.HEALTH;
    id: string;
    amount: 1 | 2;
    x: number;
    y: number;
};
