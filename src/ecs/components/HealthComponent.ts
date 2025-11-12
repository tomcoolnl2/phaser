import { Component } from '@/ecs/core/Component';

/**
 * HealthComponent - Manages entity health points and damage tracking.
 *
 * This component handles all health-related logic including damage application,
 * healing, and death detection. The invulnerable flag can be used for temporary
 * immunity (e.g., post-respawn grace period).
 *
 * @example
 * ```typescript
 * const health = new HealthComponent(100);
 *
 * const died = health.takeDamage(50);
 * console.log(health.currentHealth); // 50
 *
 * health.heal(25);
 * console.log(health.getHealthPercentage()); // 0.75
 * ```
 */
export class HealthComponent extends Component {
    /** Current health points */
    public currentHealth: number;

    /** Whether entity is currently invulnerable to damage */
    public invulnerable: boolean = false;

    /**
     * Creates a new HealthComponent.
     * @param maxHealth - Maximum health capacity (also sets initial health)
     */
    constructor(public maxHealth: number) {
        super();
        this.currentHealth = maxHealth;
    }

    /**
     * Applies damage to this entity.
     * @param amount - Amount of damage to apply
     * @returns True if entity died from this damage, false otherwise
     */
    public takeDamage(amount: number): boolean {
        if (this.invulnerable) {
            return false;
        }

        this.currentHealth = Math.max(0, this.currentHealth - amount);
        return this.currentHealth <= 0;
    }

    /**
     * Heals this entity, capped at maxHealth.
     * @param amount - Amount of health to restore
     */
    public heal(amount: number): void {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    /**
     * Checks if the entity is dead.
     * @returns True if current health is zero or below
     */
    public isDead(): boolean {
        return this.currentHealth <= 0;
    }

    /**
     * Gets current health as a percentage of max health.
     * @returns Value between 0 and 1 representing health percentage
     */
    public getHealthPercentage(): number {
        return this.currentHealth / this.maxHealth;
    }
}
