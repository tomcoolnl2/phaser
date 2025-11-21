import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { ProjectileDTO } from '@shared/dto/Projectile.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';


export class ProjectileDestroyListener extends BaseListener<ProjectileDTO> {

    protected static event: string = Events.Projectile.destroy;

    constructor(public readonly socket: Socket, private scene: GameScene) {
        super(socket);
    }

    protected override handle({ dto: { id }}: SocketResponseDTOSuccess<ProjectileDTO>) {
        const projectileSystem = this.scene.getProjectileSystem();
        const asteroidEntities = this.scene.getProjectileEntities();
        projectileSystem.destroyProjectileById(id);
        asteroidEntities.delete(id);
    }
}
