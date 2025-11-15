import { PlayerCoordinatesListener } from "./coordinates.listener";
import { PlayerHitListener } from "./hit.listener";

/**
 * Array of all player feature listeners.
 */
export const playerFeatureListeners = [
    PlayerCoordinatesListener,
    PlayerHitListener
];