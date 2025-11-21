import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { ProjectileDTO } from '@shared/dto/Projectile.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';


export class ProjectileCoordinatesListener extends BaseListener<ProjectileDTO> {
    /**
     * The event name this listener handles (`asteroid:coordinates`).
     * Used by the BaseListener for socket registration.
     * @type {string}
     * @static
     */
    protected static event: string = Events.Projectile.coordinates;

    /**
     * The response schema for validating the event payload. Set to null to skip validation.
     * @type {null}
     * @protected
     * @static
     */
    protected static responseSchema: null = null;

    /**
     * Enables debug logging for this listener. Set to false to disable logging.
     * @type {boolean}
     * @static
     */
    protected static log: boolean = false;

    /**
     * Constructs a new AsteroidCoordinatesListener.
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
     * Handles a validated `asteroid:coordinates` event response from the server.
     *
     * This method updates the position of an asteroid entity in the ECS when the server sends new coordinates.
     *
     * @param response - The validated SocketResponseDTOSuccess containing the AsteroidDTO with updated coordinates.
     * @protected
     */
    protected override handle(response: SocketResponseDTOSuccess<ProjectileDTO>) {
        const projectileDTO = response.dto;
        const projectileEntities = this.scene.getProjectileEntities();
        const entity = projectileEntities.get(projectileDTO.id);
        if (entity) {
            const transform = entity.getComponent(TransformComponent);
            if (transform) {
                transform.sprite.setPosition(projectileDTO.x, projectileDTO.y);
            }
        }
    }
}
