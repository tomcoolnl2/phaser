import { GameConfig } from './config';
/**
 * Parameters for out-of-bounds check.
 * @property x - X coordinate to check
 * @property y - Y coordinate to check
 * @property threshold - Optional margin to expand bounds (default: 0)
 * @property base - Optional play area dimensions (default: GameConfig.playArea)
 */
export interface OutOfBoundsParams {
    /** X coordinate to check */
    x: number;
    /** Y coordinate to check */
    y: number;
    /** Margin to expand bounds (default: 0) */
    threshold?: number;
    /** Play area dimensions (default: GameConfig.playArea) */
    bounds?: { width: number; height: number };
}

/**
 * Checks if a point is beyond the play area, with an optional threshold/margin.
 * @param params - Object containing x, y, threshold, and base (play area)
 * @returns True if (x, y) is out of bounds, false otherwise
 */
export function isOutOfBounds({ x, y, threshold = 0, bounds = GameConfig.playArea }: OutOfBoundsParams): boolean {
    const { width, height } = bounds;
    return x < -threshold || x > width + threshold || y < -threshold || y > height + threshold;
}

/**
 * Returns a random integer between low (inclusive) and high (exclusive).
 * @param low - The lower bound (inclusive)
 * @param high - The upper bound (exclusive)
 * @returns A random integer in the range [low, high)
 */
export function randomInt(low: number, high: number): number {
    return (Math.random() * (high - low) + low) << 0;
}