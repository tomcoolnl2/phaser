import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { AsteroidHitDTO } from '@shared/dto/Asteroid.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { HealthComponent } from '@/ecs/components/HealthComponent';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';

/**
 * Listener for the `asteroid:hit` event from the server.
 *
 * This listener is responsible for updating the health and visual state of asteroid entities in the ECS architecture
 * when the server notifies that an asteroid has been hit. It reduces the asteroid's health and triggers a visual flash effect.
 *
 * Usage:
 *   new AsteroidHitListener(socket, scene);
 *
 * @extends BaseListener<AsteroidHitDTO>
 */
export class AsteroidHitListener extends BaseListener<AsteroidHitDTO> {
    /**
     * The event name this listener handles (`asteroid:hit`).
     * Used by the BaseListener for socket registration.
     * @type {string}
     * @protected
     * @static
     */
    protected static event: string = Events.Asteroid.hit;

    /**
     * Constructs a new AsteroidHitListener.
     *
     * @param socket - The Socket.IO client instance to listen on.
     * @param scene - The current GameScene instance (used for ECS entity management).
     */
    constructor(
        public readonly socket: Socket,
        private scene: GameScene
    ) {
        super(socket);
    }

    /**
     * Handles a validated `asteroid:hit` event response from the server.
     *
     * This method reduces the health of the asteroid entity and triggers a visual flash effect
     * when the server notifies that the asteroid has been hit.
     *
     * @param response - The validated SocketResponseDTOSuccess containing the AsteroidHitDTO for the hit asteroid.
     * @protected
     */
    protected override handle(response: SocketResponseDTOSuccess<AsteroidHitDTO>) {
        const { asteroidId, damage } = response.dto;
        const asteroidSystem = this.scene.getAsteroidSystem();
        const asteroidEntities = this.scene.getAsteroidEntities();
        const entity = asteroidEntities.get(asteroidId);
        if (entity) {
            const health = entity.getComponent(HealthComponent);
            if (health) {
                health.currentHealth = Math.max(0, health.currentHealth - damage);
            }
            const transform = entity.getComponent(TransformComponent);
            if (transform) {
                asteroidSystem.flashAsteroid(transform.sprite);
            }
        }
    }
}
