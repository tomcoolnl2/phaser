import { ProjectileType } from '../types';


/**
 * Data Transfer Object representing a projectile entity (bullet, rocket, etc.) in the game.
 *
 * Used for network synchronization and ECS entity creation.
 */
export class ProjectileDTO {
    /**
     * The type discriminator for this DTO. Always 'projectile'.
     */
    public readonly type: string = 'projectile';

    /**
     * Unique identifier for the projectile.
     */
    public readonly id: string;

    /**
     * Creates a new ProjectileDTO instance.
     *
     * @param ownerId - The ID of the player/entity that fired or owns this projectile.
     * @param projectileType - The type of projectile (bullet, rocket, laser, etc.).
     * @param collisionRadius - The collision radius for hit detection.
     * @param damage - The damage this projectile deals on impact.
     * @param x - The current X position of the projectile.
     * @param y - The current Y position of the projectile.
     * @param directionX - The X component of the projectile's direction vector.
     * @param directionY - The Y component of the projectile's direction vector.
     * @param speed - The speed of the projectile.
     */
    constructor(
        public readonly ownerId: string,
        public readonly projectileType: ProjectileType,
        public readonly collisionRadius: number,
        public readonly damage: number,
        public x: number,
        public y: number,
        public directionX: number,
        public directionY: number,
        public speed: number,
    ) {
        this.id = crypto.randomUUID();
    }
}