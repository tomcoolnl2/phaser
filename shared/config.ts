/**
 * Game Configuration
 * Centralized settings for the entire game
 */

import { AmmoAmount, AmmoType } from './types';

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
    playArea: {
        width: 1024,
        height: 768,
    },
    player: {
        startingMaxHealth: 1, // for now, we die instantly on a hit
        startingLevel: 1,
        playerMaxLevel: 5,
        angularVelocity: 300,
        acceleration: 200,
        maxVelocity: 300,
        drag: 100,
        angularDrag: 200,
        accelerationMultiplier: 1.2, // Multiplier for acceleration
        rotationSpeedMultiplier: 1.5, // Multiplier for rotation speed
    },
    weapon: {
        baseFireRate: 400, // milliseconds between shots
        startingAmmo: AmmoAmount.BULLET,
        startingAmmoType: AmmoType.BULLET,
    },
    asteroid: {
        health: 10,
        maxVelocity: 100,
        collisionRadius: 70, // Distance for ship collision
        ammoCollisionRadius: 60, // Distance for ammo collision
    },
    pickup: {
        collisionRadius: 40,
    },
    server: {
        asteroidSpeed: 2, // pixels per update
        asteroidSpawnInterval: 5000, // milliseconds
        pickupSpawnInterval: 2000, // milliseconds
    },
    // Debug settings - controlled by VITE_DEV_MODE or individual VITE_* flags
    debug: {
        showAsteroidHealth: isDevMode || getEnvBoolean('SHOW_ASTEROID_HEALTH', false),
        showPlayerNames: isDevMode || getEnvBoolean('SHOW_PLAYER_NAMES', false),
        showAmmo: isDevMode || getEnvBoolean('SHOW_AMMO', false),
    },
};
