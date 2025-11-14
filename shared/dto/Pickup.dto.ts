import { Coordinates } from '@shared/model';
import { AmmoAmount, AmmoType } from '@shared/types';

export enum PickupType {
    AMMO = 'ammo',
    HEALTH = 'health',
}

export type PickupDTO = (AmmoPickupDTO | HealthPickupDTO) & Coordinates;

export type AmmoPickupDTO = {
    type: PickupType.AMMO;
    id: string;
    amount: AmmoAmount;
    ammoType?: AmmoType;
};

export type HealthPickupDTO = {
    type: PickupType.HEALTH;
    id: string;
    amount: 1 | 2;
};
