import { Component } from '../Component';
import { CollisionLayer } from '../types/CollisionLayer';

/**
 * ColliderComponent - Defines collision detection properties for an entity.
 * 
 * This component stores collision data including the collision radius and layer-based
 * collision filtering. Layers allow selective collision (e.g., player bullets don't
 * collide with the player who fired them).
 * 
 * @example
 * ```typescript
 * // Player collides with enemies and asteroids
 * const playerCollider = new ColliderComponent(
 *     16,                                  // radius
 *     CollisionLayer.PLAYER,               // layer
 *     [CollisionLayer.ENEMY, CollisionLayer.ASTEROID]  // collides with these layers
 * );
 * 
 * // Check if should collide with enemy
 * if (playerCollider.shouldCollideWith(CollisionLayer.ENEMY)) {
 *     // handle collision...
 * }
 * ```
 */
export class ColliderComponent extends Component {
    /** Collision radius in pixels */
    public radius: number;
    
    /** Collision layer identifier for this entity */
    public layer: CollisionLayer;
    
    /** Array of layers this entity can collide with */
    public collidesWithLayers: CollisionLayer[];

    /**
     * Creates a new ColliderComponent.
     * @param radius - Collision radius in pixels
     * @param layer - This entity's collision layer
     * @param collidesWithLayers - Layers this entity can collide with
     */
    constructor(radius: number, layer: CollisionLayer, collidesWithLayers: CollisionLayer[] = []) {
        super();
        this.radius = radius;
        this.layer = layer;
        this.collidesWithLayers = collidesWithLayers;
    }

    /**
     * Checks if this entity should collide with another layer.
     * @param otherLayer - The layer to check against
     * @returns True if collision should occur
     */
    public shouldCollideWith(otherLayer: CollisionLayer): boolean {
        return this.collidesWithLayers.includes(otherLayer);
    }
}
