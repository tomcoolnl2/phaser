import { Component } from '../Component';

/**
 * Collider Component
 * Defines collision properties
 */
export class ColliderComponent extends Component {
    public radius: number;
    public layer: string; // e.g., 'player', 'enemy', 'bullet', 'pickup'
    public collidesWithLayers: string[];

    constructor(radius: number, layer: string, collidesWithLayers: string[] = []) {
        super();
        this.radius = radius;
        this.layer = layer;
        this.collidesWithLayers = collidesWithLayers;
    }

    public shouldCollideWith(otherLayer: string): boolean {
        return this.collidesWithLayers.includes(otherLayer);
    }
}
