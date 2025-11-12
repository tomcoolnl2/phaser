export enum PickupType {
    AMMO = 'ammo',
    HEALTH = 'health',
}

export type PickupDTO = AmmoPickupDTO | HealthPickupDTO;

export type AmmoPickupDTO = {
    type: PickupType.AMMO;
    uuid: string;
    amount: boolean;
    // ammoType: bullet | rocket | mine; // future use
};

export type HealthPickupDTO = {
    type: PickupType.HEALTH;
    uuid: string;
    amount: 1;
};
