import { GameConfig } from '@shared/config';
import { AsteroidSize, AsteroidDTO, AsteroidCollisionRadius } from '../shared/dto/Asteroid.dto';
import { GameServer } from './GameServer';

/**
 * Utility class for common GameServer logic (spawning, math, logging, etc).
 */
export class GameServerUtils {
    /**
     * Converts an angle in radians to a normalized direction vector.
     * @param angle - Angle in radians
     * @returns Object with dx and dy components
     */
    public static directionFromAngle(angle: number): { dx: number; dy: number } {
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        return { dx, dy };
    }

    /**
     * Normalizes a direction vector and scales it to the given speed.
     * @param dx - X direction
     * @param dy - Y direction
     * @param speed - Desired speed
     * @returns Object with normalized and scaled dx and dy
     */
    public static normalizeDirection(dx: number, dy: number, speed: number) {
        const norm = Math.sqrt(dx * dx + dy * dy);
        if (norm === 0) {
            return { dx: 0, dy: 0 };
        }
        return { dx: (dx / norm) * speed, dy: (dy / norm) * speed };
    }

    /**
     * Returns a random AsteroidSize based on predefined probabilities.
     * Probabilities: SMALL = 0.5, MEDIUM = 0.3, LARGE = 0.2
     * @returns Random AsteroidSize
     */
    private static getRandomAsteroidSize(): AsteroidSize {
        const rand = Math.random();
        if (rand < 0.5) {
            return AsteroidSize.SMALL;
        } else if (rand < 0.8) {
            return AsteroidSize.MEDIUM;
        } else {
            return AsteroidSize.LARGE;
        }
    }

    /**
     * Returns the maximum health for an asteroid based on its size.
     * @param size - AsteroidSize
     * @returns Maximum health value
     */
    private static getMaxHealthForSize(size: AsteroidSize): number {
        switch (size) {
            case AsteroidSize.SMALL:
                return 6;
            case AsteroidSize.MEDIUM:
                return 8;
            case AsteroidSize.LARGE:
            default:
                return 10;
        }
    }

    /**
     * Returns random spawn position and velocity for an asteroid at the edge of the play area.
     * @param width - Play area width
     * @param height - Play area height
     * @param threshold - Spawn offset from edge
     * @returns Object with x, y, dx, dy properties
     */
    private static getRandomAsteroidSpawn(threshold: number = 32) {
        const { width, height } = GameConfig.playArea;
        const speed = GameConfig.server.asteroidSpeed;

        // Pick a random edge: 0=top, 1=bottom, 2=left, 3=right
        const edge = Math.floor(Math.random() * 4);
        let x = 0,
            y = 0,
            dx = 0,
            dy = 0;
        switch (edge) {
            case 0: // top
                x = Math.random() * width;
                y = -threshold;
                dx = (Math.random() - 0.5) * speed;
                dy = speed;
                break;
            case 1: // bottom
                x = Math.random() * width;
                y = height + threshold;
                dx = (Math.random() - 0.5) * speed;
                dy = -speed;
                break;
            case 2: // left
                x = -threshold;
                y = Math.random() * height;
                dx = speed;
                dy = (Math.random() - 0.5) * speed;
                break;
            case 3: // right
            default:
                x = width + threshold;
                y = Math.random() * height;
                dx = -speed;
                dy = (Math.random() - 0.5) * speed;
                break;
        }
        
        const size = GameServerUtils.getRandomAsteroidSize();
        const direction = GameServerUtils.normalizeDirection(dx, dy, speed);
        const maxHealth = GameServerUtils.getMaxHealthForSize(size);
        const collisionRadius = AsteroidCollisionRadius[size];
        return { x, y, ...direction, size, collisionRadius, maxHealth };
    }

    /**
     * Factory for creating an AsteroidDTO with all required properties.
     * @returns New AsteroidDTO instance
     */
    public static createAsteroidDTO(): AsteroidDTO {
        const asteroidSpawn = GameServerUtils.getRandomAsteroidSpawn();
        return new AsteroidDTO({ ...asteroidSpawn });
    }
}
