import { Component } from '../core/Component';

/**
 * UpgradeType - Available upgrade categories.
 */
export enum UpgradeType {
    FIRE_RATE = 'FIRE_RATE',
    DAMAGE = 'DAMAGE',
    SPEED = 'SPEED',
    HEALTH = 'HEALTH',
    ROTATION_SPEED = 'ROTATION_SPEED',
    SCORE = 'SCORE',
}

/**
 * Upgrade - Configuration for a single upgrade type.
 */
export interface Upgrade {
    /** Type of upgrade */
    type: UpgradeType;
    /** Current level (0 = no upgrade) */
    level: number;
    /** Maximum allowed level */
    maxLevel: number;
    /** Value gained per level */
    valuePerLevel: number;
}

/**
 * UpgradesComponent - Tracks all upgrades applied to an entity.
 *
 * This component manages a progression system where entities can be upgraded
 * across multiple categories. Each upgrade type has a level, max level, and
 * value per level. The UpgradeSystem reads this component to apply stat changes.
 *
 * @example
 * ```typescript
 * const upgrades = new UpgradesComponent();
 *
 * // Check if upgrade is available
 * if (upgrades.canUpgrade(UpgradeType.DAMAGE)) {
 *     upgrades.upgrade(UpgradeType.DAMAGE);
 * }
 *
 * // Get current level
 * const damageLevel = upgrades.getUpgradeLevel(UpgradeType.DAMAGE);
 * console.log(`Damage is at level ${damageLevel}`);
 * ```
 */
export class UpgradesComponent extends Component {
    /** Map of upgrade types to their current state */
    public upgrades: Map<UpgradeType, Upgrade> = new Map();

    constructor() {
        super();
        this.initializeUpgrades();
    }

    /**
     * Initializes all upgrade types with default values.
     * @private
     */
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

        // Rotation Speed: each level increases rotation by 20%
        this.upgrades.set(UpgradeType.ROTATION_SPEED, {
            type: UpgradeType.ROTATION_SPEED,
            level: 0,
            maxLevel: 3,
            valuePerLevel: 0.2,
        });
    }

    /**
     * Checks if an upgrade type can be upgraded further.
     * @param type - The upgrade type to check
     * @returns True if the upgrade hasn't reached max level
     */
    public canUpgrade(type: UpgradeType): boolean {
        const upgrade = this.upgrades.get(type);
        return upgrade ? upgrade.level < upgrade.maxLevel : false;
    }

    /**
     * Upgrades a specific type by one level.
     * @param type - The upgrade type to level up
     * @returns True if upgrade succeeded, false if already at max level
     */
    public upgrade(type: UpgradeType): boolean {
        const upgrade = this.upgrades.get(type);
        if (!upgrade || upgrade.level >= upgrade.maxLevel) {
            return false;
        }

        upgrade.level++;
        return true;
    }

    /**
     * Gets the full upgrade configuration for a type.
     * @param type - The upgrade type to retrieve
     * @returns The upgrade configuration or undefined
     */
    public getUpgrade(type: UpgradeType): Upgrade | undefined {
        return this.upgrades.get(type);
    }

    /**
     * Gets the current level of a specific upgrade type.
     * @param type - The upgrade type to check
     * @returns Current level (0 if not found)
     */
    public getUpgradeLevel(type: UpgradeType): number {
        return this.upgrades.get(type)?.level || 0;
    }

    /**
     * Calculates the total number of upgrades across all types.
     * @returns Sum of all upgrade levels
     */
    public getTotalUpgradeLevels(): number {
        let total = 0;
        this.upgrades.forEach(upgrade => {
            total += upgrade.level;
        });
        return total;
    }
}
