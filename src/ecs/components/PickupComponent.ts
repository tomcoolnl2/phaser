import { Component } from '../core/Component';

/**
 * Component that marks an entity as a collectible pickup.
 *
 * Stores pickup-specific data such as the type of pickup (ammo, health, etc.)
 * and its value. Used in conjunction with TransformComponent to create
 * complete pickup entities.
 *
 * @example
 * ```typescript
 * const pickupComp = new PickupComponent('ammo', 10);
 * entity.addComponent(pickupComp);
 * ```
 */
export class PickupComponent extends Component {
    /** Type of pickup (e.g., 'ammo', 'health') */
    public type: string;

    /** Value to grant when collected (e.g., ammo amount, health points) */
    public value: number;

    /** Reference to particle emitter for visual effects */
    public particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

    /**
     * Creates a new PickupComponent.
     * @param type - Type of pickup ('ammo', 'health', etc.)
     * @param value - Amount to grant when collected
     */
    constructor(type: string = 'ammo', value: number = 10) {
        super();
        this.type = type;
        this.value = value;
    }
}
