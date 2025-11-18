// AsteroidHitListener.ts
import { createListener } from '../createListener';
import { Events } from '@shared/events';
import { AsteroidHitDTO, AsteroidDTO, AsteroidCauseOfDeath } from '@shared/dto/Asteroid.dto';
import { GameServerContext } from '../../GameServerContext';

/**
 * Listener for asteroid hit events.
 *
 * Flow:
 * - When a hit happens, calls `server.broadcastAsteroidHit(...)` to emit a hit event.
 * - If the asteroid dies, calls `server.broadcastAsteroidDestroy(...)` to emit a destroy event.
 *
 * Validates incoming hit requests, applies damage, broadcasts hit and destroy events,
 * and updates asteroid state.
 *
 * @see createListener
 */
export const AsteroidHitListener = createListener<AsteroidHitDTO, AsteroidDTO>({
    event: Events.Asteroid.hit,
    log: true,

    async handle(_socket, request) {
        const server = GameServerContext.get();
        const { asteroidId, damage } = request.dto;

        // Ignore hits on already destroyed asteroids
        if (server.isAsteroidDestroyed(asteroidId)) {
            return { ok: false, message: 'Asteroid already destroyed' };
        }

        const asteroid = server.damageAsteroid(asteroidId, damage);
        if (!asteroid) {
            return { ok: false, message: 'Asteroid not found' };
        }

        // Broadcast the hit to all clients
        server.broadcastAsteroidHit({ ok: true, dto: new AsteroidHitDTO(asteroidId, damage) });

        // If asteroid is dead, destroy it and broadcast
        if (asteroid.health <= 0) {
            const destroyed = server.destroyAsteroid(asteroidId, AsteroidCauseOfDeath.HIT);
            if (destroyed) {
                server.broadcastAsteroidDestroy({ ok: true, dto: destroyed });
            }
        }

        return { ok: true, dto: asteroid };
    },
});
