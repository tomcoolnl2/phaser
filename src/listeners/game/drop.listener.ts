import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { PickupDTO } from '@shared/dto/Pickup.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { PickupEntityFactory } from '@/ecs/factories/PickupEntityFactory';

/**
 * Listener for the `game:drop` event from the server.
 *
 * This listener is responsible for handling the creation and registration of pickup entities in the ECS architecture
 * when the server notifies that a pickup has been dropped. It ensures that duplicate pickups are not created and
 * manages the removal of any existing pickup with the same ID before creating a new one.
 *
 * Usage:
 *   new GameDropListener(socket, scene);
 *
 * @extends BaseListener<PickupDTO>
 */
export class GameDropListener extends BaseListener<PickupDTO> {
    /**
     * The event name this listener handles (`game:drop`).
     * Used by the BaseListener for socket registration.
     * @type {string}
     * @protected
     * @static
     */
    protected static event: string = Events.Game.drop;

    /**
     * Constructs a new GameDropListener.
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
     * Handles a validated `game:drop` event response from the server.
     *
     * This method removes any existing pickup entity with the same ID, then creates and registers the new pickup entity
     * in the ECS and the pickupEntities map.
     *
     * @param response - The validated SocketResponseDTOSuccess containing the PickupDTO for the dropped pickup.
     * @protected
     */
    protected override handle(response: SocketResponseDTOSuccess<PickupDTO>) {
        const dto = response.dto;
        const pickupEntities = this.scene.getPickupEntities();
        if (pickupEntities.has(dto.id)) {
            const existing = pickupEntities.get(dto.id);
            if (existing) {
                this.scene.entityManager.removeEntity(existing.id);
                const transform = existing.getComponent(TransformComponent);
                if (transform) {
                    transform.sprite.destroy();
                }
            }
        }
        const pickupEntity = new PickupEntityFactory(this.scene).create(dto);
        pickupEntities.set(dto.id, pickupEntity);
        this.scene.entityManager.addEntity(pickupEntity);
    }
}
