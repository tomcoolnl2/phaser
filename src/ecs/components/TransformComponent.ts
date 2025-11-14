import Phaser from 'phaser';
import { Component } from '../core/Component';

/**
 * TransformComponent - Manages entity position, rotation, and scale.
 *
 * This component wraps a Phaser sprite and provides convenient getters/setters
 * for accessing and modifying its transform properties. It serves as the bridge
 * between ECS entities and Phaser's rendering system.
 *
 * @example
 * ```typescript
 * const transform = new TransformComponent(sprite);
 * transform.x = 100;
 * transform.y = 200;
 * transform.rotation = Math.PI / 4; // 45 degrees
 * ```
 */
export class TransformComponent extends Component {
    /**
     * Creates a new TransformComponent.
     * @param sprite - The Phaser sprite to manage
     */
    constructor(public sprite: Phaser.Physics.Arcade.Sprite) {
        super();
        this.sprite = sprite;
    }

    /** Gets the sprite's X position */
    public get x(): number {
        return this.sprite.x;
    }

    /** Sets the sprite's X position */
    public set x(value: number) {
        this.sprite.x = value;
    }

    /** Gets the sprite's Y position */
    public get y(): number {
        return this.sprite.y;
    }

    /** Sets the sprite's Y position */
    public set y(value: number) {
        this.sprite.y = value;
    }

    /** Gets the sprite's rotation in radians */
    public get rotation(): number {
        return this.sprite.rotation;
    }

    /** Sets the sprite's rotation in radians */
    public set rotation(value: number) {
        this.sprite.rotation = value;
    }
}
