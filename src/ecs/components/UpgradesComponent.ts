import { Component } from '../Component';

export enum UpgradeType {
    FIRE_RATE = 'FIRE_RATE',
    DAMAGE = 'DAMAGE',
    SPEED = 'SPEED',
    HEALTH = 'HEALTH',
    MAX_AMMO = 'MAX_AMMO',
    ROTATION_SPEED = 'ROTATION_SPEED',
}

export interface Upgrade {
    type: UpgradeType;
    level: number;
    maxLevel: number;
    valuePerLevel: number;
}

/**
 * Upgrades Component
 * Tracks all upgrades applied to an entity
 */
export class UpgradesComponent extends Component {
    public upgrades: Map<UpgradeType, Upgrade> = new Map();

    constructor() {
        super();
        this.initializeUpgrades();
    }

    private initializeUpgrades(): void {
        // Fire rate: each level reduces fire rate by 10%
        this.upgrades.set(UpgradeType.FIRE_RATE, {
            type: UpgradeType.FIRE_RATE,
            level: 0,
            maxLevel: 5,
            valuePerLevel: 0.1,
        });

        // Damage: each level adds 1 damage
        this.upgrades.set(UpgradeType.DAMAGE, {
            type: UpgradeType.DAMAGE,
            level: 0,
            maxLevel: 10,
            valuePerLevel: 1,
        });

        // Speed: each level increases speed by 15%
        this.upgrades.set(UpgradeType.SPEED, {
            type: UpgradeType.SPEED,
            level: 0,
            maxLevel: 5,
            valuePerLevel: 0.15,
        });

        // Health: each level adds 2 max health
        this.upgrades.set(UpgradeType.HEALTH, {
            type: UpgradeType.HEALTH,
            level: 0,
            maxLevel: 5,
            valuePerLevel: 2,
        });

        // Max Ammo: each level adds 10 ammo capacity
        this.upgrades.set(UpgradeType.MAX_AMMO, {
            type: UpgradeType.MAX_AMMO,
            level: 0,
            maxLevel: 10,
            valuePerLevel: 10,
        });

        // Rotation Speed: each level increases rotation by 20%
        this.upgrades.set(UpgradeType.ROTATION_SPEED, {
            type: UpgradeType.ROTATION_SPEED,
            level: 0,
            maxLevel: 3,
            valuePerLevel: 0.2,
        });
    }

    canUpgrade(type: UpgradeType): boolean {
        const upgrade = this.upgrades.get(type);
        return upgrade ? upgrade.level < upgrade.maxLevel : false;
    }

    upgrade(type: UpgradeType): boolean {
        const upgrade = this.upgrades.get(type);
        if (!upgrade || upgrade.level >= upgrade.maxLevel) {
            return false;
        }

        upgrade.level++;
        return true;
    }

    getUpgrade(type: UpgradeType): Upgrade | undefined {
        return this.upgrades.get(type);
    }

    getUpgradeLevel(type: UpgradeType): number {
        return this.upgrades.get(type)?.level || 0;
    }

    getTotalUpgradeLevels(): number {
        let total = 0;
        this.upgrades.forEach(upgrade => {
            total += upgrade.level;
        });
        return total;
    }
}
