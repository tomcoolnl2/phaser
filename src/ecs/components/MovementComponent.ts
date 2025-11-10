import { Component } from '../Component';

/**
 * Movement Component
 * Handles velocity and movement parameters
 */
export class MovementComponent extends Component {
    public maxVelocity: number;
    public acceleration: number;
    public drag: number;
    public rotationSpeed: number;
    public canMove: boolean = true;

    // Input state (set by InputSystem)
    public rotationInput: number = 0; // -1 (left), 0 (none), 1 (right)
    public thrustInput: number = 0; // 0 (none), 1 (forward)
    public brakeInput: boolean = false;

    // Current rotation target (for smooth rotation)
    public targetRotation: number = 0;

    constructor(maxVelocity: number, acceleration: number, drag: number, rotationSpeed: number) {
        super();
        this.maxVelocity = maxVelocity;
        this.acceleration = acceleration;
        this.drag = drag;
        this.rotationSpeed = rotationSpeed;
    }

    public upgradeSpeed(increasePercent: number): void {
        this.maxVelocity *= 1 + increasePercent;
        this.acceleration *= 1 + increasePercent;
    }

    public upgradeRotation(increasePercent: number): void {
        this.rotationSpeed *= 1 + increasePercent;
    }
}
