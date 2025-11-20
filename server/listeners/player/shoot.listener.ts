import { Events } from '../../../shared/events';
import { PlayerDTO } from '../../../shared/dto/Player.dto';
import { WeaponDTO } from '../../../shared/dto/Weapon.dto';
import { ProjectileDTO } from '../../../shared/dto/Projectile.dto';
import { GameServerContext } from '../../GameServerContext';
import { createListener } from '../createListener';

export const PlayerShootListener = createListener<[PlayerDTO, WeaponDTO], ProjectileDTO>({
    //
    event: Events.Player.shoot,
    log: true,

    async handle(socket, request) {
        // request already validated by BaseListener
        const [playerDTO, weaponDTO] = request.dto;
        const server = GameServerContext.get();
        const projectile = server.createProjectile(playerDTO, weaponDTO);
        const response = { ok: true, dto: projectile };
        // broadcast to everyone
        socket.emit(Events.Projectile.create, response);
        return response;
    },
});
