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

    public get x(): number {
        return this.sprite.x;
    }

    public set x(value: number) {
        this.sprite.x = value;
    }

    public get y(): number {
        return this.sprite.y;
    }

    public set y(value: number) {
        this.sprite.y = value;
    }

    public get rotation(): number {
        return this.sprite.rotation;
    }

    public set rotation(value: number) {
        this.sprite.rotation = value;
    }
}
