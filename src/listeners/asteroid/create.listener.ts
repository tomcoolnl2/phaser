import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { AsteroidDTO } from '@shared/dto/Asteroid.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { AsteroidEntityFactory } from '@/ecs/factories/AsteroidEntityFactory';
import { HealthComponent } from '@/ecs/components/HealthComponent';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';

/**
 * Listener for the `asteroid:create` event from the server.
 *
 * This listener is responsible for handling the creation and registration of asteroid entities in the ECS architecture
 * when the server notifies that a new asteroid has been created. It sets up the asteroid entity, assigns health values,
 * and registers it in the scene's asteroidEntities map.
 *
 * Usage:
 *   new AsteroidCreateListener(socket, scene);
 *
 * @extends BaseListener<AsteroidDTO>
 */
export class AsteroidCreateListener extends BaseListener<AsteroidDTO> {
    /**
     * The event name this listener handles (`asteroid:create`).
     * Used by the BaseListener for socket registration.
     * @type {string}
     * @protected
     * @static
     */
    protected static event: string = Events.Asteroid.create;

    /**
     * Constructs a new AsteroidCreateListener.
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
     * Handles a validated `asteroid:create` event response from the server.
     *
     * This method creates a new asteroid entity using the provided AsteroidDTO, sets its health values,
     * and registers it in the ECS and asteroidEntities map.
     *
     * @param response - The validated SocketResponseDTOSuccess containing the AsteroidDTO for the new asteroid.
     * @protected
     */
    protected override handle(response: SocketResponseDTOSuccess<AsteroidDTO>) {
        const asteroidDTO = response.dto;
        const factory = new AsteroidEntityFactory(this.scene);
        const entity = factory.create(asteroidDTO);
        // Set HP and maxHp if HealthComponent exists
        const health = entity.getComponent(HealthComponent);
        if (health) {
            health.currentHealth = asteroidDTO.health;
            health.maxHealth = asteroidDTO.maxHealth;
        }
        const asteroidEntities = this.scene.getAsteroidEntities();
        asteroidEntities.set(asteroidDTO.id, entity);
    }
}
