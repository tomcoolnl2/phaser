import { PlayerSignOnListener } from './signon.listener';
import { PlayerSignOutListener } from './signout.listener';
import { PlayerCoordinatesListener } from './coordinates.listener';
import { PlayerHitListener } from './hit.listener';
import { PickupListener } from './pickup.listener';

/**
 * Array of all player feature listeners.
 */
export const playerFeatureListeners = [
    PlayerSignOnListener, 
    PlayerSignOutListener, 
    PlayerCoordinatesListener, 
    PlayerHitListener, 
    PickupListener
];
