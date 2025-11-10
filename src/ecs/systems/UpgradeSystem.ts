import { System } from '../System';
import { Entity } from '../Entity';
import { UpgradesComponent, UpgradeType } from '../components/UpgradesComponent';
import { WeaponComponent } from '../components/WeaponComponent';
import { MovementComponent } from '../components/MovementComponent';
import { HealthComponent } from '../components/HealthComponent';

/**
 * UpgradeSystem - Applies stat upgrades to entity components.
 * 
 * This system provides an API for applying upgrades to entities. When an upgrade
 * is purchased (via applyUpgrade), it immediately modifies the relevant component's
 * stats. Supported upgrades:
 * - Fire rate reduction (WeaponComponent)
 * - Damage increase (WeaponComponent)
 * - Speed boost (MovementComponent)
 * - Max health increase (HealthComponent)
 * - Max ammo increase (WeaponComponent)
 * - Rotation speed boost (MovementComponent)
 * 
 * Unlike most systems, this doesn't process entities every frame. Instead, it
 * provides the applyUpgrade() method that's called when upgrades are purchased.
 * 
 * @example
 * ```typescript
 * const upgradeSystem = new UpgradeSystem(scene);
 * 
 * // When player purchases an upgrade
 * const success = upgradeSystem.applyUpgrade(playerEntity, UpgradeType.DAMAGE);
 * if (success) {
 *     console.log('Damage upgraded!');
 * }
 * ```
 */
export class UpgradeSystem extends System {
    public getRequiredComponents() {
        return [UpgradesComponent];
    }

    /**
     * Empty update - upgrades are applied on-demand via applyUpgrade().
     * @param _entity - Unused
     * @param _deltaTime - Unused
     */
    public update(_entity: Entity, _deltaTime: number): void {
        // This system doesn't need per-frame updates
        // Upgrades are applied when purchased via applyUpgrade()
    }

    /**
     * Applies an upgrade to an entity if available.
     * 
     * This checks if the upgrade can be performed (hasn't reached max level),
     * increments the upgrade level, and applies the stat changes to the
     * appropriate component.
     * 
     * @param entity - The entity to upgrade
     * @param upgradeType - The type of upgrade to apply
     * @returns True if upgrade succeeded, false if already at max level or invalid
     */
    public applyUpgrade(entity: Entity, upgradeType: UpgradeType): boolean {
        const upgrades = entity.getComponent(UpgradesComponent);
        if (!upgrades || !upgrades.canUpgrade(upgradeType)) {
            return false;
        }

        // Increment upgrade level
        if (!upgrades.upgrade(upgradeType)) {
            return false;
        }

        const upgrade = upgrades.getUpgrade(upgradeType);
        if (!upgrade) return false;

        // Apply the upgrade effect based on type
        switch (upgradeType) {
            case UpgradeType.FIRE_RATE: {
                const weapon = entity.getComponent(WeaponComponent);
                if (weapon) {
                    weapon.upgradeFireRate(upgrade.valuePerLevel);
                }
                break;
            }

            case UpgradeType.DAMAGE: {
                const weapon = entity.getComponent(WeaponComponent);
                if (weapon) {
                    weapon.upgradeDamage(upgrade.valuePerLevel);
                }
                break;
            }

            case UpgradeType.SPEED: {
                const movement = entity.getComponent(MovementComponent);
                if (movement) {
                    movement.upgradeSpeed(upgrade.valuePerLevel);
                }
                break;
            }

            case UpgradeType.HEALTH: {
                const health = entity.getComponent(HealthComponent);
                if (health) {
                    health.maxHealth += upgrade.valuePerLevel;
                    health.currentHealth += upgrade.valuePerLevel;
                }
                break;
            }

            case UpgradeType.MAX_AMMO: {
                const weapon = entity.getComponent(WeaponComponent);
                if (weapon) {
                    weapon.maxAmmo += upgrade.valuePerLevel;
                }
                break;
            }

            case UpgradeType.ROTATION_SPEED: {
                const movement = entity.getComponent(MovementComponent);
                if (movement) {
                    movement.upgradeRotation(upgrade.valuePerLevel);
                }
                break;
            }
        }

        return true;
    }

    /**
     * Get available upgrades for an entity
     */
    public getAvailableUpgrades(entity: Entity): UpgradeType[] {
        const upgrades = entity.getComponent(UpgradesComponent);
        if (!upgrades) return [];

        const available: UpgradeType[] = [];
        for (const type of Object.values(UpgradeType)) {
            if (upgrades.canUpgrade(type)) {
                available.push(type);
            }
        }
        return available;
    }
}
