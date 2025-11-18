import { CoordinatesDTO } from './Coordinates.dto';

/**
 * Data Transfer Object representing a sign-on event for a player.
 * Extends CoordinatesDTO to include position information.
 */
export class SignOnDTO extends CoordinatesDTO {
    /**
     * The DTO type identifier for sign-on events.
     * @type {string}
     */
    public readonly type: string = 'sign-on';

    /**
     * Creates a new SignOnDTO instance.
     * @param name - The player's display name
     * @param x - The X coordinate of the player
     * @param y - The Y coordinate of the player
     */
    constructor(
        /** The player's display name */
        public name: string,
        /** The X coordinate of the player */
        x: number,
        /** The Y coordinate of the player */
        y: number
    ) {
        super(x, y);
    }
}
