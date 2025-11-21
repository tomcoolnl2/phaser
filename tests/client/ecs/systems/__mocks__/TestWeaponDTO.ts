import { WeaponDTO } from '../../../../shared/dto/Weapon.dto';
import { ProjectileType } from '../../../../shared/types';

export class TestWeaponDTO extends WeaponDTO {
    constructor() {
        super('test-id', 1, ProjectileType.BULLET, 100, 10);
    }
}
