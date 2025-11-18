import { WeaponDTO } from '../../../../shared/dto/Weapon.dto';
import { AmmoType } from '../../../../shared/types';

export class TestWeaponDTO extends WeaponDTO {
    constructor() {
        super('test-id', 1, AmmoType.BULLET, 100, 10);
    }
}
