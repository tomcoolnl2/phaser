import { v4 as uuidv4 } from 'uuid';
import { ProjectileType } from '../types';
import { CoordinatesDTO } from './Coordinates.dto';

/**
 * Configuration object for creating a ProjectileDTO.
 */
export interface ProjectileDTOConfig {
    /** The ID of the player/entity that fired or owns this projectile. */
    ownerId: string;
    /** Key for the player's sprite asset. */
    spriteKey: string;
    /** The type of projectile (bullet, rocket, laser, etc.). */
    projectileType: ProjectileType;
    /** The collision radius for hit detection. */
    collisionRadius: number;
    /** The damage this projectile deals on impact. */
    damage: number;
    /** The current X position of the projectile. */
    x: number;
    /** The current Y position of the projectile. */
    y: number;
    /** The X direction vector. */
    dx: number;
    /** The Y direction vector. */
    dy: number;
    /** The speed of the projectile. */
    speed: number;
}

/**
 * Data Transfer Object representing a projectile entity (bullet, rocket, etc.) in the game.
 * Used for network synchronization and ECS entity creation.
 */
export class ProjectileDTO extends CoordinatesDTO {
    /** The type discriminator for this DTO. Always 'projectile'. */
    public readonly type: string = 'projectile';

    /** Unique identifier for the projectile. */
    public readonly id: string;

    /** The ID of the player/entity that fired or owns this projectile. */
    public readonly ownerId: string;

    /** Key for the player's sprite asset. */
    public readonly spriteKey: string;

    /** The type of projectile (bullet, rocket, laser, etc.). */
    public readonly projectileType: ProjectileType;

    /** The collision radius for hit detection. */

    public readonly collisionRadius: number;

    /** The damage this projectile deals on impact. */
    public readonly damage: number;

    /** The X direction vector. */
    public dx: number;

    /** The Y direction vector. */
    public dy: number;

    /** The speed of the projectile. */
    public speed: number;

    /**
     * Creates a new ProjectileDTO instance.
     * @param {ProjectileDTOConfig} config - Configuration object for projectile properties
     */
    constructor(config: ProjectileDTOConfig) {
        super({ x: config.x, y: config.y });
        this.id = uuidv4();
        this.ownerId = config.ownerId;
        this.spriteKey = config.spriteKey;
        this.projectileType = config.projectileType;
        this.collisionRadius = config.collisionRadius;
        this.damage = config.damage;
        this.dx = config.dx;
        this.dy = config.dy;
        this.speed = config.speed;
    }
}
