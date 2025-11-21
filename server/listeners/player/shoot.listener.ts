import { Events } from '../../../shared/events';
import { PlayerDTO } from '../../../shared/dto/Player.dto';
import { WeaponDTO } from '../../../shared/dto/Weapon.dto';
import { ProjectileDTO } from '../../../shared/dto/Projectile.dto';
import { GameServerContext } from '../../GameServerContext';
import { createListener } from '../createListener';
import { WeaponSchema } from '@shared/schema/Weapon.schema';
import { PlayerSchema } from '@shared/schema/Player.schema';

export const PlayerShootListener = createListener<[PlayerDTO, WeaponDTO], ProjectileDTO>({
    //
    event: Events.Player.shoot,
    requestSchema: [PlayerSchema, WeaponSchema],
    log: true,

    async handle(_socket, request) {
        const server = GameServerContext.get();
        const [playerDTO, weaponDTO] = request.dto;
        const projectile = server.createProjectile(playerDTO, weaponDTO);
        const response = { ok: true, dto: projectile };
        // broadcast to everyone including self
        server.broadcastPlayerShoot(response);
        return response;
    },
});
