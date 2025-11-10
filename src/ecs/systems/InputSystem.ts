import { System } from '../System';
import { Entity } from '../Entity';
import { PlayerComponent } from '../components/PlayerComponent';
import { MovementComponent } from '../components/MovementComponent';
import { WeaponComponent } from '../components/WeaponComponent';
import { ComponentClass, Component } from '../Component';

/**
 * InputSystem - Handles player input and converts it to component state
 * This system reads keyboard input and updates the movement and weapon components
 */
export class InputSystem extends System {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private fireKey?: Phaser.Input.Keyboard.Key;

    constructor(scene: Phaser.Scene) {
        super(scene);
        this.setupInput();
    }

    private setupInput(): void {
        if (!this.scene.input.keyboard) return;

        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.fireKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    public getRequiredComponents(): ComponentClass<Component>[] {
        return [PlayerComponent, MovementComponent, WeaponComponent];
    }

    public update(entity: Entity, _deltaTime: number): void {
        const playerComp = entity.getComponent(PlayerComponent);
        if (!playerComp || !playerComp.isLocal) return;

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
