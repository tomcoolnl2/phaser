import { Socket } from 'socket.io-client';
import { GameScene } from '@/scenes/GameScene';

import { GameDropListener } from './game/drop.listener';
import { PlayerJoinedListener } from './player/joined.listener';
import { PlayerProtagonistListener } from './player/protagonist.listener';
import { PlayerCompetitorsListener } from './player/competitors.listener';
import { PlayerCoordinatesListener } from './player/coordinates.listener';
import { PlayerPickupListener } from './player/pickup.listener';
import { PlayerHitListener } from './player/hit.listener';
import { PlayerDestroyListener } from './player/destroy.listener';
import { PlayerQuitListener } from './player/quit.listener';
import { AsteroidCreateListener } from './asteroid/create.listener';
import { AsteroidCoordinatesListener } from './asteroid/coordinates.listener';
import { AsteroidHitListener } from './asteroid/hit.listener';
import { AsteroidDestroyListener } from './asteroid/destroy.listener';
import { ProjectileCreateListener } from './projectile/create.listener';
import { ProjectileCoordinatesListener } from './projectile/coordinates.listener';
import { ProjectileDestroyListener } from './projectile/destroy.listener';

/**
 * List of all feature listener classes to be registered for Socket.IO events.
 * Each listener handles a specific event and is instantiated with the socket and scene.
 */
const listenerClasses = [
    GameDropListener,
    PlayerJoinedListener,
    PlayerProtagonistListener,
    PlayerCompetitorsListener,
    PlayerCoordinatesListener,
    PlayerPickupListener,
    PlayerHitListener,
    PlayerDestroyListener,
    PlayerQuitListener,
    AsteroidCreateListener,
    AsteroidCoordinatesListener,
    AsteroidHitListener,
    AsteroidDestroyListener,
    ProjectileCreateListener,
    ProjectileCoordinatesListener,
    ProjectileDestroyListener,
];

/**
 * Dependencies required to create feature listeners.
 * @property socket - The Socket.IO client instance.
 * @property scene - The current GameScene instance.
 */
export interface FeatureListenersDeps {
    /** The Socket.IO client instance. */
    socket: Socket;
    /** The current GameScene instance. */
    scene: GameScene;
}

/**
 * Instantiates and registers all feature listeners for the provided socket and scene.
 *
 * @param deps - The dependencies required to create the listeners (socket and scene).
 * @returns An array of instantiated listener objects.
 */
export function createFeatureListeners({ socket, scene }: FeatureListenersDeps) {
    return listenerClasses.map(ListenerClass => new ListenerClass(socket, scene));
}
