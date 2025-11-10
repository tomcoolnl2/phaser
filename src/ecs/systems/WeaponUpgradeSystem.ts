import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { PlayerComponent } from '../components/PlayerComponent';
import { WeaponComponent } from '../components/WeaponComponent';
import { ComponentClass, Component } from '../core/Component';
import type { Level } from '../../../shared/models';

/**
 * WeaponUpgradeSystem - Automatically updates weapon visuals based on player level.
 *
 * This system monitors the player's level and updates the bullet sprite texture key
 * to match. As players level up (1-5), their bullets change appearance:
 * - Level 1 → 'laser-level-1' (bullet1.png)
 * - Level 2 → 'laser-level-2' (bullet2.png)
 * - ...and so on
 *
 * The system detects level changes and updates WeaponComponent.bulletSpriteKey,
 * which WeaponSystem uses when spawning bullets.
 *
 * @example
 * ```typescript
 * const upgradeSystem = new WeaponUpgradeSystem(scene);
 * entityManager.addSystem(upgradeSystem);
 * // Player bullets now automatically match their level
 * ```
 */
export class WeaponUpgradeSystem extends System {
    //
    public getRequiredComponents(): ComponentClass<Component>[] {
        return [PlayerComponent, WeaponComponent];
    }

    public update(entity: Entity, _deltaTime: number): void {
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
