/**
 * HealthManager tracks and manages health for all game entities (asteroids, players, etc).
 *
 * Provides methods to set, get, damage, heal, and remove health for entities by ID.
 * Used by the server to maintain authoritative health state and synchronize with clients.
 *
 * Example usage:
 *   healthManager.setHealth('asteroid-1', 3, 3);
 *   healthManager.damage('asteroid-1', 1);
 *   healthManager.heal('player-2', 2);
 *   healthManager.isDead('asteroid-1');
 *   healthManager.remove('asteroid-1');
 */
export class HealthManager {
    
    /** Map of entity IDs to current health values */
    private healthMap = new Map<string, number>();

    /** Map of entity IDs to maximum health values */
    private maxHealthMap = new Map<string, number>();

    /**
     * Sets the current and maximum health for an entity.
     * @param id - Unique entity ID
     * @param current - Current health value
     * @param max - Maximum health value
     */
    public setHealth(id: string, current: number, max: number) {
        this.healthMap.set(id, current);
        this.maxHealthMap.set(id, max);
    }

    /**
     * Gets the current health for an entity.
     * @param id - Unique entity ID
     * @returns Current health value (0 if not found)
     */
    public getHealth(id: string): number {
        return this.healthMap.get(id) ?? 0;
    }

    /**
     * Gets the maximum health for an entity.
     * @param id - Unique entity ID
     * @returns Maximum health value (0 if not found)
     */
    public getMaxHealth(id: string): number {
        return this.maxHealthMap.get(id) ?? 0;
    }

    /**
     * Damages an entity by a given amount.
     * @param id - Unique entity ID
     * @param amount - Amount of damage to apply
     * @returns New health value after damage
     */
    public damage(id: string, amount: number): number {
        let hp = this.getHealth(id);
        hp -= amount;
        this.healthMap.set(id, hp);
        return hp;
    }

    /**
     * Heals an entity by a given amount, up to its max health.
     * @param id - Unique entity ID
     * @param amount - Amount of health to restore
     * @returns New health value after healing
     */
    public heal(id: string, amount: number): number {
        let hp = this.getHealth(id) + amount;
        const max = this.getMaxHealth(id);
        if (hp > max) {
            hp = max;
        }
        this.healthMap.set(id, hp);
        return hp;
    }

    /**
     * Checks if an entity is dead (health <= 0).
     * @param id - Unique entity ID
     * @returns True if dead, false otherwise
     */
    public isDead(id: string): boolean {
        return this.getHealth(id) <= 0;
    }

    /**
     * Removes all health tracking for an entity.
     * @param id - Unique entity ID
     */
    public remove(id: string) {
        this.healthMap.delete(id);
        this.maxHealthMap.delete(id);
    }
}
