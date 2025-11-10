import { System } from '../System';
import { Entity } from '../Entity';
import { PlayerComponent } from '../components/PlayerComponent';
import { WeaponComponent } from '../components/WeaponComponent';
import { ComponentClass, Component } from '../Component';
import type { Level } from '../../../shared/models';

/**
 * WeaponUpgradeSystem - Updates weapon properties based on player level
 * This system automatically adjusts weapon stats when player level changes
 */
export class WeaponUpgradeSystem extends System {
    //
    getRequiredComponents(): ComponentClass<Component>[] {
        return [PlayerComponent, WeaponComponent];
    }

    update(entity: Entity, _deltaTime: number): void {
        const playerComp = entity.getComponent(PlayerComponent);
        const weaponComp = entity.getComponent(WeaponComponent);

        if (!playerComp || !weaponComp) return;

        // Update bullet sprite based on level
        const bulletSpriteKey = this.getBulletSpriteForLevel(playerComp.level);
        if (weaponComp.bulletSpriteKey !== bulletSpriteKey) {
            console.log(`[WeaponUpgradeSystem] Updating bullet sprite: ${weaponComp.bulletSpriteKey} -> ${bulletSpriteKey} (Player level: ${playerComp.level})`);
            weaponComp.bulletSpriteKey = bulletSpriteKey;
        }
    }

    private getBulletSpriteForLevel(level: Level): string {
        return `laser-level-${level}`;
    }
}
