import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { ProjectileDTO } from '@shared/dto/Projectile.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { ProjectileEntityFactory } from '@/ecs/factories/ProjectileEntityFactory';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';


export class ProjectileCreateListener extends BaseListener<ProjectileDTO> {
    
    protected static event: string = Events.Asteroid.create;

    /**
     * Constructs a new ProjectileCreateListener.
     *
     * @param socket - The Socket.IO client instance to listen on.
     * @param scene - The current GameScene instance (used for ECS entity management).
     */
    constructor(public readonly socket: Socket, private scene: GameScene) {
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
    protected override handle(response: SocketResponseDTOSuccess<ProjectileDTO>) {
        const projectileDTO = response.dto;
        const factory = new ProjectileEntityFactory(this.scene);
        const entity = factory.create(projectileDTO);
        const projectileEntities = this.scene.getProjectileEntities();
        console.log('Projectile created:', projectileDTO);
        projectileEntities.set(projectileDTO.id, entity);
    }
}
