/**
 * Data Transfer Object representing 2D coordinates.
 */
export class CoordinatesDTO {
    /**
     * The DTO type identifier for coordinates.
     * @type {string}
     */
    public readonly type: string = 'coordinates';

    /**
     * Creates a new CoordinatesDTO instance.
     * @param x - The X coordinate
     * @param y - The Y coordinate
     */
    constructor(
        /** The X coordinate */
        public x: number,
        /** The Y coordinate */
        public y: number
    ) {}
}
