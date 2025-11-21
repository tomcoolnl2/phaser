import { v4 as uuidv4 } from 'uuid';
import { GameConfig } from '../../shared/config';
import { Coordinates, PlayerLevel } from '../../shared/model';
import { CoordinatesDTO } from './Coordinates.dto';

/**
 * Configuration object for creating a PlayerDTO.
 */
export interface PlayerDTOConfig {
    /** Unique identifier for the player */
    id?: string;
    /** Player's display name */
    name: string;
    /** X coordinate of the player */
    x: number;
    /** Y coordinate of the player */
    y: number;
    /** Key for the player's sprite asset */
    spriteKey: string;
    /** Whether this player is the local player */
    isLocal: boolean;
    /** Initial level of the player */
    level?: PlayerLevel;
    /** Current health of the player */
    health?: number;
    /** Maximum health of the player */
    maxHealth?: number;
    /** The current facing direction of the player in radians */
    angle?: number;
}
/**
 * Data Transfer Object representing a player in the game.
 * Implements Coordinates for position tracking.
 */
export class PlayerDTO extends CoordinatesDTO {
    /** The DTO type identifier for player. Always 'player'. */
    public readonly type: string = 'player';

    /** Unique identifier for the player */
    public id: string;

    /** Player's display name */
    public name: string;

    /** Key for the player's sprite asset */
    public spriteKey: string;

    /** Whether this player is the local player */
    public isLocal: boolean;

    /** Initial level of the player */
    public level: PlayerLevel;

    /** Current health of the player */
    public health: number;

    /** Maximum health of the player */
    public maxHealth: number;

    /** The current facing direction of the player in radians */
    public angle: number;

    /**
     * Creates a new PlayerDTO instance.
     * @param {PlayerDTOConfig} config - Configuration object for player properties
     */
    constructor(config: PlayerDTOConfig) {
        super({ x: config.x, y: config.y });
        this.id = config.id ?? uuidv4();
        this.name = config.name;
        this.spriteKey = config.spriteKey;
        this.isLocal = config.isLocal;
        this.level = config.level ?? (GameConfig.player.startingLevel as PlayerLevel);
        this.health = config.maxHealth ?? GameConfig.player.startingMaxHealth;
        this.maxHealth = config.maxHealth ?? GameConfig.player.startingMaxHealth;
        this.angle = config.angle ?? 0;
    }

    /**
     * The player's current position as coordinates.
     * @returns {Coordinates} The player's position
     */
    public get position(): Coordinates {
        return { x: this.x, y: this.y } as Coordinates;
    }
}
