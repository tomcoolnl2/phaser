import { AmmoAmount, AmmoType } from '@shared/types';

export enum PickupType {
    AMMO = 'ammo',
    HEALTH = 'health',
}

export type PickupDTO = AmmoPickupDTO | HealthPickupDTO;

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
