import { TurretLevel, WeaponLevelProvider } from '@shared/model';
import { Component } from '@/ecs/core/Component';

/**
 * TurretComponent - Provider for turret-specific properties, including level.
 */
export class TurretComponent extends Component implements WeaponLevelProvider<TurretLevel> {
    constructor(public level: TurretLevel = 1) {
        super();
    }
}
