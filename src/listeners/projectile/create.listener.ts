import { Socket } from 'socket.io-client';
import { Events } from '@shared/events';
import { ProjectileDTO } from '@shared/dto/Projectile.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { ProjectileEntityFactory } from '@/ecs/factories/ProjectileEntityFactory';
import { GameScene } from '@/scenes/GameScene';
import { BaseListener } from '../BaseListener';

export class ProjectileCreateListener extends BaseListener<ProjectileDTO> {
    protected static event: string = Events.Projectile.create;

    protected static log: boolean = false;

    constructor(
        public readonly socket: Socket,
        private scene: GameScene
    ) {
        super(socket);
    }

    protected override handle({ dto }: SocketResponseDTOSuccess<ProjectileDTO>) {
        const factory = new ProjectileEntityFactory(this.scene);
        const entity = factory.create(dto);
        const projectileEntities = this.scene.getProjectileEntities();
        projectileEntities.set(dto.id, entity);
        this.scene.entityManager.addEntity(entity);
    }
}
