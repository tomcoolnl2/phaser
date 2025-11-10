import { Component } from '../Component';

/**
 * Health Component
 * Tracks entity health and damage
 */
export class HealthComponent extends Component {
    public maxHealth: number;
    public currentHealth: number;
    public invulnerable: boolean = false;

    constructor(maxHealth: number) {
        super();
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
    }

    public takeDamage(amount: number): boolean {
        if (this.invulnerable) return false;

        this.currentHealth = Math.max(0, this.currentHealth - amount);
        return this.currentHealth <= 0;
    }

    public heal(amount: number): void {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    public isDead(): boolean {
        return this.currentHealth <= 0;
    }

    public getHealthPercentage(): number {
        return this.currentHealth / this.maxHealth;
    }
}
