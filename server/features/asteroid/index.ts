import { AsteroidHitListener } from "./hit.listener";
import { AsteroidDestroyListener } from "./destroy.listener";

/**
 * Array of all asteroid feature listeners.
 */
export const asteroidFeatureListeners = [
    AsteroidHitListener,
    AsteroidDestroyListener,
];