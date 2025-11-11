import { Component } from '@/ecs/core';
import { PickupType } from '@/ecs/types';

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
    /** Type of pickup */
    public type: PickupType;

    /** Value to grant when collected (e.g., ammo amount, health points) */
    public value: number;

    /** Reference to particle emitter for visual effects */
    public particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

    /**
     * Creates a new PickupComponent.
     * @param type - Type of pickup (PickupType.AMMO, PickupType.HEALTH, etc.)
     * @param value - Amount to grant when collected
     */
    constructor(type: PickupType = PickupType.AMMO, value: number = 10) {
        super();
        this.type = type;
        this.value = value;
    }
}
