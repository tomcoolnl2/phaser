/**
 * Collision layer identifiers for the collision system.
 * 
 * Used by ColliderComponent to define which entities can collide with each other.
 * This enum provides type safety and prevents typos in layer names.
 * 
 * @example
 * ```typescript
 * // Create a player collider that collides with enemies and asteroids
 * const collider = new ColliderComponent(
 *     16,
 *     CollisionLayer.PLAYER,
 *     [CollisionLayer.ENEMY, CollisionLayer.ASTEROID]
 * );
 * ```
 */
export enum CollisionLayer {
    /** Player ship layer */
    PLAYER = 'player',
    
    /** Enemy ship layer */
    ENEMY = 'enemy',
    
    /** Bullet projectile layer */
    BULLET = 'bullet',
    
    /** Collectible pickup layer */
    PICKUP = 'pickup',
    
    /** Asteroid/comet layer */
    ASTEROID = 'asteroid',
}
