import { GameConfig } from '../../../shared/config';
import { Component } from '../core/Component';

/**
 * MovementComponent - Manages entity movement parameters and input state.
 *
 * This component stores all data related to movement: velocity limits, acceleration,
 * drag, rotation speed, and input state. It's designed to work with the InputSystem
 * (which sets input values) and MovementSystem (which applies movement logic).
 *
 * @example
 * ```typescript
 * const movement = new MovementComponent(
 *     200,  // maxVelocity
 *     500,  // acceleration
 *     0.97, // drag
 *     0.03  // rotationSpeed
 * );
 *
 * // InputSystem sets these
 * movement.rotationInput = -1; // turning left
 * movement.thrustInput = 1;    // accelerating
 *
 * // MovementSystem reads these and updates physics
 * ```
 */
export class MovementComponent extends Component {
    /** Current velocity in pixels per second */
    public currentVelocity: number = 0;

    /** Maximum velocity the entity can reach */
    public maxVelocity: number;

    /** Acceleration force applied when thrusting */
    public acceleration: number;

    /** Drag coefficient (0-1, lower = less friction) */
    public drag: number;

    /** Rotation speed in radians per frame */
    public rotationSpeed: number;

    /** Whether this entity can currently move */
    public canMove: boolean = true;

    // Input state (set by InputSystem)
    /** Rotation input: -1 (left), 0 (none), 1 (right) */
    public rotationInput: number = 0;

    /** Thrust input: 0 (none), 1 (forward) */
    public thrustInput: number = 0;

    /** Whether brake is currently applied */
    public brakeInput: boolean = false;

    /** Target rotation for smooth turning (in radians) */
    public targetRotation: number = 0;

    /**
     * Creates a new MovementComponent.
     * @param maxVelocity - Maximum velocity in pixels per second
     * @param acceleration - Acceleration force
     * @param drag - Drag coefficient (0-1)
     * @param rotationSpeed - Rotation speed in radians per frame
     */
    constructor(maxVelocity: number, acceleration: number, drag: number, rotationSpeed: number) {
        super();
        this.maxVelocity = maxVelocity;
        this.acceleration = acceleration * GameConfig.player.accelerationMultiplier;
        this.drag = drag;
        this.rotationSpeed = rotationSpeed * GameConfig.player.rotationSpeedMultiplier;
        this.currentVelocity = 0;
    }

    /**
     * Upgrades movement speed by a percentage.
     * @param increasePercent - Percentage to increase (0.1 = 10% increase)
     */
    public upgradeSpeed(increasePercent: number): void {
        this.maxVelocity *= 1 + increasePercent;
        this.acceleration *= 1 + increasePercent;
    }

    /**
     * Upgrades rotation speed by a percentage.
     * @param increasePercent - Percentage to increase (0.1 = 10% increase)
     */
    public upgradeRotation(increasePercent: number): void {
        this.rotationSpeed *= 1 + increasePercent;
    }
}
