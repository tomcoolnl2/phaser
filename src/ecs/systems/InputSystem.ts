import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { PlayerComponent } from '../components/PlayerComponent';
import { MovementComponent } from '../components/MovementComponent';
import { WeaponComponent } from '../components/WeaponComponent';
import { ComponentClass, Component } from '../core/Component';

/**
 * InputSystem - Captures player input and updates component state.
 *
 * This system reads keyboard input and translates it into component data that
 * other systems (MovementSystem, WeaponSystem) can act upon. It only processes
 * local player entities (isLocal = true).
 *
 * Input mapping:
 * - Arrow Left/Right → MovementComponent.rotationInput
 * - Arrow Up → MovementComponent.thrustInput
 * - Arrow Down → MovementComponent.brakeInput
 * - Space → WeaponComponent.triggerPulled
 *
 * @example
 * ```typescript
 * const inputSystem = new InputSystem(scene);
 * entityManager.addSystem(inputSystem);
 * // Now player input automatically updates entity components
 * ```
 */
export class InputSystem extends System {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private fireKey?: Phaser.Input.Keyboard.Key;

    /**
     * Creates a new InputSystem and sets up keyboard listeners.
     * @param scene - The Phaser scene
     */
    constructor(scene: Phaser.Scene) {
        super(scene);
        this.setupInput();
    }

    /**
     * Initializes keyboard input listeners.
     * @private
     */
    private setupInput(): void {
        if (!this.scene.input.keyboard) {
            return;
        }

        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.fireKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    public getRequiredComponents(): ComponentClass<Component>[] {
        return [PlayerComponent, MovementComponent, WeaponComponent];
    }

    /**
     * Reads keyboard input and updates movement and weapon components.
     * Only processes entities where PlayerComponent.isLocal = true.
     */
    public update(entity: Entity, _deltaTime: number): void {
        const playerComp = entity.getComponent(PlayerComponent);
        if (!playerComp || !playerComp.isLocal) {
            return;
        }

        const movementComp = entity.getComponent(MovementComponent);
        const weaponComp = entity.getComponent(WeaponComponent);

        if (!this.cursors) return;

        // Handle rotation input
        if (movementComp) {
            movementComp.rotationInput = 0;
            if (this.cursors.left?.isDown) {
                movementComp.rotationInput = -1;
            }
            if (this.cursors.right?.isDown) {
                movementComp.rotationInput = 1;
            }

            // Handle thrust/brake input
            movementComp.thrustInput = 0;
            movementComp.brakeInput = false;

            if (this.cursors.up?.isDown) {
                movementComp.thrustInput = 1;
            } else if (this.cursors.down?.isDown) {
                movementComp.brakeInput = true;
            }
        }

        // Handle weapon input
        if (weaponComp && this.fireKey?.isDown) {
            weaponComp.triggerPulled = true;
        } else if (weaponComp) {
            weaponComp.triggerPulled = false;
        }
    }
}
