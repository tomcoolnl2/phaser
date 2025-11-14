import { Component } from '@/ecs/core/Component';
import { PickupType } from '@shared/dto/PickupDTO';

/**
 * Component that marks an entity as a collectible pickup.
 *
 * Stores pickup-specific data such as the type of pickup (ammo, health, etc.)
 * and its value. Used in conjunction with TransformComponent to create
 * complete pickup entities.
 *
 * @example
 * ```typescript
 * const pickupComp = new PickupComponent(PickupType.AMMO, 10);
 * entity.addComponent(pickupComp);
 * ```
 */
export class PickupComponent extends Component {
    /**
     * Creates a new PickupComponent.
     * @param type - Type of pickup (PickupType.AMMO, PickupType.HEALTH, etc.)
     * @param value - Amount to grant when collected
     */
    constructor(
        public type: PickupType = PickupType.AMMO,
        public value: number = 10
    ) {
        super();
    }
}
