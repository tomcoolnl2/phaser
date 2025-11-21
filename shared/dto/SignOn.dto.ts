/**
 * Configuration object for creating a SignOnDTO.
 */
export interface SignOnDTOConfig {
    /** The player's display name. */
    name: string;
    /** The X coordinate of the player. */
    width: number;
    /** The Y coordinate of the player. */
    height: number;
}

/**
 * Data Transfer Object representing a sign-on event for a player.
 * Extends CoordinatesDTO to include position information.
 *
 * @property {string} type - DTO type identifier, always 'sign-on'.
 * @property {string} name - The player's display name.
 * @property {number} width - The X coordinate of the player.
 * @property {number} height - The Y coordinate of the player.
 */
export class SignOnDTO {
    /**
     * The DTO type identifier for sign-on events. Always 'sign-on'.
     */
    public readonly type: string = 'sign-on';

    /** The player's display name. */
    public name: string;

    /** The X coordinate of the player. */
    public width: number;

    /** The Y coordinate of the player. */
    public height: number;

    /**
     * Creates a new SignOnDTO instance.
     * @param {SignOnDTOConfig} config - Configuration object for sign-on properties
     */
    constructor({ name, width, height }: SignOnDTOConfig) {
        this.name = name;
        this.width = width;
        this.height = height;
    }
}
