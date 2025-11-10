import Phaser from 'phaser';
import { Component } from '../Component';

/**
 * Weapon Component
 * Handles shooting and ammo
 */
export class WeaponComponent extends Component {
    public ammo: number;
    public maxAmmo: number;
    public fireRate: number; // milliseconds between shots
    public bulletSpeed: number;
    public damage: number;
    public lastFired: number = 0;
    public bullets: Phaser.Physics.Arcade.Group;
    public bulletSpriteKey: string = 'laser-level-1';

    // Input state (set by InputSystem)
    public triggerPulled: boolean = false;

    constructor(bullets: Phaser.Physics.Arcade.Group, ammo: number, maxAmmo: number = 999, fireRate: number = 250, bulletSpeed: number = 400, damage: number = 1, bulletSpriteKey: string = 'laser-level-1') {
        super();
        this.bullets = bullets;
        this.ammo = ammo;
        this.maxAmmo = maxAmmo;
        this.fireRate = fireRate;
        this.bulletSpeed = bulletSpeed;
        this.damage = damage;
        this.bulletSpriteKey = bulletSpriteKey;
    }

    canFire(): boolean {
        const now = Date.now();
        return this.ammo > 0 && now - this.lastFired >= this.fireRate;
    }

    fire(): void {
        this.lastFired = Date.now();
        if (this.ammo > 0) {
            this.ammo--;
        }
    }

    addAmmo(amount: number): void {
        this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
    }

    upgradeFireRate(reductionPercent: number): void {
        this.fireRate = Math.max(50, this.fireRate * (1 - reductionPercent));
    }

    upgradeDamage(increaseAmount: number): void {
        this.damage += increaseAmount;
    }
}
