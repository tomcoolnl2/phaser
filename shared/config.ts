/**
 * Game Configuration
 * Centralized settings for the entire game
 */

/**
 * Helper function to read boolean environment variables
 * @param key - Environment variable name (without VITE_ prefix)
 * @param defaultValue - Default value if env var is not set
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
    const value = import.meta.env?.[`VITE_${key}`];
    if (value === undefined) {
        return defaultValue;
    }
    return value === 'true' || value === '1';
}

// Check if dev mode is enabled (shows all debug info)
const isDevMode = getEnvBoolean('DEV_MODE', false);

export const GameConfig = {

    player: {
        startingAmmo: 10,
        ammoPerPickup: 10,
        angularVelocity: 300,
        acceleration: 200,
        maxVelocity: 300,
        fireRate: 250, // milliseconds between shots
        drag: 100,
        angularDrag: 200,
    },

    asteroid: {
        health: 3,
        maxVelocity: 100,
        collisionRadius: 70, // Distance for ship collision
        bulletCollisionRadius: 60, // Distance for bullet collision
    },

    pickup: {
        collisionRadius: 40,
    },

    server: {
        cometSpawnInterval: 10000, // milliseconds
        pickupSpawnInterval: 15000, // milliseconds
        cometSpeed: 2, // pixels per update
    },

    // Debug settings - controlled by VITE_DEV_MODE or individual VITE_* flags
    debug: {
        showAsteroidHealth: isDevMode || getEnvBoolean('SHOW_ASTEROID_HEALTH', false),
        showPlayerNames: isDevMode || getEnvBoolean('SHOW_PLAYER_NAMES', false),
        showAmmo: isDevMode || getEnvBoolean('SHOW_AMMO', false),
    },
};
