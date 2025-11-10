import { System } from '../System';
import { Entity } from '../Entity';
import { UpgradesComponent, UpgradeType } from '../components/UpgradesComponent';
import { WeaponComponent } from '../components/WeaponComponent';
import { MovementComponent } from '../components/MovementComponent';
import { HealthComponent } from '../components/HealthComponent';

/**
 * UpgradeSystem
 * Applies upgrade effects to entity components
 */
export class UpgradeSystem extends System {
    public getRequiredComponents() {
        return [UpgradesComponent];
    }

    public update(_entity: Entity, _deltaTime: number): void {
        // This system doesn't need per-frame updates
        // Upgrades are applied when purchased via applyUpgrade()
    }

    /**
     * Apply an upgrade to an entity
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
