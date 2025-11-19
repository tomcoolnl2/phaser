import { GameConfig } from '../../shared/config';
import { ProjectileRefillAmount, ProjectileMaxAmount, ProjectileType, ProjectileSpeed } from '../types';


const MAX_AMMO: Record<ProjectileType, ProjectileMaxAmount> = {
    [ProjectileType.BULLET]: ProjectileMaxAmount.BULLET,
    [ProjectileType.ROCKET]: ProjectileMaxAmount.ROCKET,
    [ProjectileType.LASER]: ProjectileMaxAmount.LASER,
    [ProjectileType.PLASMA]: ProjectileMaxAmount.PLASMA,
    [ProjectileType.MINE]: ProjectileMaxAmount.MINE,
};

export const DEFAULT_AMMO: Record<ProjectileType, ProjectileRefillAmount> = {
    [ProjectileType.BULLET]: ProjectileRefillAmount.BULLET,
    [ProjectileType.ROCKET]: ProjectileRefillAmount.ROCKET,
    [ProjectileType.LASER]: ProjectileRefillAmount.LASER,
    [ProjectileType.PLASMA]: ProjectileRefillAmount.PLASMA,
    [ProjectileType.MINE]: ProjectileRefillAmount.MINE,
};

const AMMO_SPEED: Record<ProjectileType, ProjectileSpeed> = {
    [ProjectileType.BULLET]: ProjectileSpeed.BULLET,
    [ProjectileType.ROCKET]: ProjectileSpeed.ROCKET,
    [ProjectileType.LASER]: ProjectileSpeed.LASER,
    [ProjectileType.PLASMA]: ProjectileSpeed.PLASMA,
    [ProjectileType.MINE]: ProjectileSpeed.MINE,
};

const AMMO_DAMAGE: Record<ProjectileType, number> = {
    [ProjectileType.BULLET]: 1,
    [ProjectileType.ROCKET]: 5,
    [ProjectileType.LASER]: 3,
    [ProjectileType.PLASMA]: 4,
    [ProjectileType.MINE]: 6,
};

/**
 * WeaponDTO - Data Transfer Object for weapon state and configuration.
 *
 * Tracks ammo for each ammo type, weapon level, fire rate, and current selected ammo type.
 * Provides safe methods for switching ammo types and clamping ammo values.
 */
export class WeaponDTO {
    /** Unique weapon identifier */
    public readonly id: string;

    /** Weapon level (upgrade/progression) */
    public level: number;

    /** Currently selected ammo type */
    private _ammoType: ProjectileType;

    /** Weapon fire rate (shots per second or ms between shots) */
    public fireRate: number;

    /** Bullet speed for each ammo type */
    private _speed: Record<ProjectileType, number>;

    /** Current ammo count for each ammo type */
    private _ammo: Record<ProjectileType, number>;

    /** Maximum ammo allowed for each ammo type */
    private readonly _maxAmmo: Record<ProjectileType, number>;

    private _damage: Record<ProjectileType, number>;

    /**
     * Create a new WeaponDTO.
     * @param id - Unique weapon identifier
     * @param level - Weapon level (default: startingLevel)
     * @param ammoType - Initial selected ammo type (default: startingProjectileType)
     * @param fireRate - Weapon fire rate (default: baseFireRate)
     * @param speed - Initial bullet speed for the selected ammo type
     * @param ammoOverride - Optional override for starting ammo of the selected type
     */
    constructor(
        id: string,
        level: number = GameConfig.player.startingLevel,
        ammoType: ProjectileType = GameConfig.weapon.startingProjectileType,
        fireRate: number = GameConfig.weapon.baseFireRate,
        ammoOverride?: number
    ) {
        this.id = id;
        this.level = level;
        this.fireRate = fireRate;
        this._ammoType = ammoType;

        // Defensive copies so nothing external mutates data
        this._ammo = { ...DEFAULT_AMMO };
        this._speed = { ...AMMO_SPEED };
        this._damage = { ...AMMO_DAMAGE };
        this._maxAmmo = { ...MAX_AMMO };

        // Override starting ammo only for the active ammoType
        if (ammoOverride != null) {
            this._ammo[ammoType] = this.clampAmmo(ammoType, ammoOverride);
        }
    }

    /**
     * Get the current ammo for the selected ammo type.
     * @returns Current ammo for the selected ammo type
     */
    public get ammo(): number {
        return this._ammo[this._ammoType];
    }

    /**
     * Set the current ammo for the selected ammo type, clamped to allowed range.
     * @param value - New ammo value
     */
    public set ammo(value: number) {
        this._ammo[this._ammoType] = this.clampAmmo(this._ammoType, value);
    }

    /**
     * Get the current speed for the selected ammo type.
     * @returns Current speed for the selected ammo type
     */
    public get speed(): number {
        return this._speed[this._ammoType];
    }

    /**
     * Set the current speed for the selected ammo type.
     * @returns Current speed for the selected ammo type
     */
    private set speed(value: number) {
        this._speed[this._ammoType] = value;
    }

    /**
     * Get the current damage for the selected ammo type.
     * @returns Current damage for the selected ammo type
     */
    public get damage(): number {
        return this._damage[this._ammoType];
    }

    /**
     * Set the current damage for the selected ammo type.
     * @returns Current damage for the selected ammo type
     */
    public set damage(value: number) {
        this._damage[this._ammoType] = value;
    }

    /**
     * Get the current maxAmmo for the selected ammo type.
     * @returns Current maxAmmo for the selected ammo type
     */
    public get maxAmmo(): number {
        return this._maxAmmo[this._ammoType];
    }

    /**
     * Get the ammo count for any ammo type.
     * @param type - The ammo type to query
     * @returns Ammo count for the specified type
     */
    public getAmmo(type: ProjectileType): number {
        return this._ammo[type];
    }

    /**
     * Add ammo to a specific ammo type, clamped to allowed range.
     * @param type - The ammo type to add to
     * @param amount - Amount of ammo to add
     */
    public addAmmo(): void {
        const newAmmo = this._ammo[this._ammoType] + DEFAULT_AMMO[this._ammoType];
        this._ammo[this._ammoType] = this.clampAmmo(this._ammoType, newAmmo);
    }

    /**
     * Get the speed count for any ammo type.
     * @param type - The ammo type to query
     * @returns Ammo count for the specified type
     */
    public getAmmoSpeed(type: ProjectileType): number {
        return this._speed[type];
    }

    /**
     * Get the current ammoType
     * @returns Current ammoType
     */
    public get ammoType(): ProjectileType {
        return this._ammoType;
    }

    /**
     * Switch the currently selected ammo type.
     * @param type - The new ammo type to select
     */
    public switchProjectileType(type: ProjectileType) {
        this._ammoType = type;
        this.ammo = this._ammo[type];
        this.speed = this._speed[type];
    }

    /**
     * Clamp ammo value to the allowed range for the given ammo type.
     * @param type - The ammo type
     * @param value - The value to clamp
     * @returns The clamped ammo value
     */
    private clampAmmo(type: ProjectileType, value: number): number {
        return Math.max(0, Math.min(this._maxAmmo[type], value));
    }
}
