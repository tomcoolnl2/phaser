import { Coordinates } from '@shared/model';

/**
 * Data Transfer Object representing 2D coordinates.
 * Used for transferring position data between server and client.
 */
export class CoordinatesDTO {
    /**
     * The DTO type identifier for coordinates. Always 'coordinates'.
     */
    public readonly type: string = 'coordinates';

    /**
     * The X coordinate value.
     */
    public x: number;

    /**
     * The Y coordinate value.
     */
    public y: number;

    /**
     * Creates a new CoordinatesDTO instance.
     * @param {Coordinates} param0 - Object containing x and y values
     * @param {number} param0.x - The X coordinate
     * @param {number} param0.y - The Y coordinate
     */
    constructor({ x, y }: Coordinates) {
        this.x = x;
        this.y = y;
    }

    public get position(): Coordinates {
        return { x: this.x, y: this.y };
    }
}
