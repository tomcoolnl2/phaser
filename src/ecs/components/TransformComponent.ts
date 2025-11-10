import Phaser from 'phaser';
import { Component } from '../Component';

/**
 * Transform Component
 * Holds position, rotation, and scale data
 */
export class TransformComponent extends Component {
    public sprite: Phaser.Physics.Arcade.Sprite;

    constructor(sprite: Phaser.Physics.Arcade.Sprite) {
        super();
        this.sprite = sprite;
    }

    get x(): number {
        return this.sprite.x;
    }

    set x(value: number) {
        this.sprite.x = value;
    }

    get y(): number {
        return this.sprite.y;
    }

    set y(value: number) {
        this.sprite.y = value;
    }

    get rotation(): number {
        return this.sprite.rotation;
    }

    set rotation(value: number) {
        this.sprite.rotation = value;
    }
}
