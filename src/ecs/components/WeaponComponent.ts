import Phaser from 'phaser';
import { Component } from '../Component';

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
 *     50,                 // starting ammo
 *     999,                // max ammo
 *     250,                // fire rate (ms between shots)
 *     400,                // bullet speed
 *     1,                  // damage
 *     'laser-level-1'     // bullet sprite key
 * );
 * 
 * if (weapon.canFire()) {
 *     weapon.fire();
 *     // spawn bullet logic...
 * }
 * ```
 */
export class WeaponComponent extends Component {
    /** Current ammunition count */
    public ammo: number;
    
    /** Maximum ammunition capacity */
    public maxAmmo: number;
    
    /** Milliseconds between shots */
    public fireRate: number;
    
    /** Bullet travel speed in pixels per second */
    public bulletSpeed: number;
    
    /** Damage dealt per bullet */
    public damage: number;
    
    /** Timestamp of last shot (for fire rate limiting) */
    public lastFired: number = 0;
    
    /** Phaser group managing bullet sprites */
    public bullets: Phaser.Physics.Arcade.Group;
    
    /** Current bullet sprite texture key */
    public bulletSpriteKey: string = 'laser-level-1';

    /** Whether the trigger is currently pulled (set by InputSystem) */
    public triggerPulled: boolean = false;

    /**
     * Creates a new WeaponComponent.
     * @param bullets - Phaser group for bullet pooling
     * @param ammo - Starting ammunition count
     * @param maxAmmo - Maximum ammunition capacity
     * @param fireRate - Milliseconds between shots
     * @param bulletSpeed - Bullet travel speed in pixels/second
     * @param damage - Damage per bullet hit
     * @param bulletSpriteKey - Texture key for bullet sprite
     */
    constructor(
        bullets: Phaser.Physics.Arcade.Group,
        ammo: number,
        maxAmmo: number = 999,
        fireRate: number = 250,
        bulletSpeed: number = 400,
        damage: number = 1,
        bulletSpriteKey: string = 'laser-level-1'
    ) {
        super();
        this.bullets = bullets;
        this.ammo = ammo;
        this.maxAmmo = maxAmmo;
        this.fireRate = fireRate;
        this.bulletSpeed = bulletSpeed;
        this.damage = damage;
        this.bulletSpriteKey = bulletSpriteKey;
    }

    /**
     * Checks if the weapon can currently fire.
     * @returns True if weapon has ammo and fire rate cooldown has elapsed
     */
    public canFire(): boolean {
        const now = Date.now();
        return this.ammo > 0 && now - this.lastFired >= this.fireRate;
    }

    /**
     * Records a shot being fired, updating timestamp and consuming ammo.
     */
    public fire(): void {
        this.lastFired = Date.now();
        if (this.ammo > 0) {
            this.ammo--;
        }
    }

    /**
     * Adds ammunition, capped at maxAmmo.
     * @param amount - Amount of ammunition to add
     */
    public addAmmo(amount: number): void {
        this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
    }

    /**
     * Upgrades fire rate by reducing cooldown time.
     * @param reductionPercent - Percentage to reduce cooldown (0.1 = 10% faster)
     */
    public upgradeFireRate(reductionPercent: number): void {
        this.fireRate = Math.max(50, this.fireRate * (1 - reductionPercent));
    }

    /**
     * Upgrades weapon damage.
     * @param increaseAmount - Amount to add to base damage
     */
    public upgradeDamage(increaseAmount: number): void {
        this.damage += increaseAmount;
    }
}
