import { Component } from '@/ecs/core/Component';
import { WeaponDTO } from '@shared/dto/Weapon.dto';
import { PlayerLevel } from '@shared/model';

/**
 * WeaponComponent - Manages weapon state, ammo, and firing logic.
 *
 * This component handles all weapon-related data including ammunition tracking,
 * fire rate limiting, bullet speed/damage, and the bullet sprite pool. It works
 * with InputSystem (which sets triggerPulled) and WeaponSystem (which spawns bullets).
 *
 * @example
 * ```typescript
 * const weapon = new WeaponComponent(
 *     bulletGroup,        // Phaser bullet pool
 *     dto,                // WeaponDTO instance
 *     'projectile-1'      // bullet sprite key
 * );
 *
 * if (weapon.canFire()) {
 *     weapon.fire();
 *     // spawn bullet logic...
 * }
 * ```
 */
export class WeaponComponent extends Component {
    
    /**
     * Timestamp of the last fired shot (in milliseconds since epoch)
     */
    public lastFired: number = 0;

    /**
     * Indicates if the weapon trigger is currently pulled through keyboard input
     */
    public triggerPulled: boolean = false;

    /**
     * Creates a new WeaponComponent.
     * @param dto - local state DTO for weapon configuration
     */
    constructor(public readonly dto: WeaponDTO) {
        super();
    }

    /**
     * Checks if the weapon can currently fire.
     * @returns True if weapon has ammo and fire rate cooldown has elapsed
     */
    public canFire(): boolean {
        const now = Date.now();
        return this.dto.ammo > 0 && now - this.lastFired >= this.dto.fireRate;
    }

    // /**
    //  * Records a shot being fired, updating timestamp and consuming ammo.
    //  */
    // public fire(): void {
    //     this.lastFired = Date.now();
    //     if (this.dto.ammo > 0) {
    //         this.dto.ammo--;
    //     }
    // }

    /**
     * Gets the current ammo count.
     * @returns Current ammunition from the DTO
     */
    public getAmmo() {
        return this.dto.ammo;
    }

    /**
     * Adds ammunition, capped at maxAmmo.
     */
    public addAmmo(): void {
        this.dto.addAmmo();
    }

    /**
     * Upgrades fire rate by reducing cooldown time.
     * @param reductionPercent - Percentage to reduce cooldown (0.1 = 10% faster)
     */
    public upgradeFireRate(reductionPercent: number): void {
        this.dto.fireRate = Math.max(50, this.dto.fireRate * (1 - reductionPercent));
    }

    /**
     * Upgrades weapon damage.
     * @param increaseAmount - Amount to add to base damage
     */
    public upgradeDamage(increaseAmount: number): void {
        this.dto.damage += increaseAmount;
    }

    /**
     * Gets the current damage a ammo type can do.
     * @returns Current damage from the DTO
     */
    public getDamage(): number {
        return this.dto.damage;
    }

    /**
     * Sets a new damage level.
     * @param damage - New damage value to set
     */
    public setDamage(damage: number): void {
        this.dto.damage = damage;
    }

    /**
     * Sets a new damage level based on player level.
     * @param level - Player level to scale damage for
     */
    public setDamageForLevel(level: PlayerLevel): void {
        const scaledDamage = 1 + 0.5 * (level - 1);
        this.setDamage(scaledDamage);
    }

    /**
     * Gets the current speed a ammo type can do.
     * @returns Current speed for a ammo type
     */
    public getAmmoSpeed(): number {
        return this.dto.speed;
    }
}
