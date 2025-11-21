import { Component } from '@/ecs/core/Component';
import { ProjectileType } from '@shared/types';

/**
 * ProjectileDamageComponent represents the damage value associated with a projectile or entity.
 *
 * The damage is determined by the projectile type, but can be overridden.
 * This component is typically attached to projectile entities (bullets, rockets, etc.).
 *
 * @example
 * const damageComponent = new ProjectileDamageComponent(ProjectileType.ROCKET);
 * console.log(damageComponent.damage); // 50
 * damageComponent.damage = 100;
 * console.log(damageComponent.damage); // 100
 */
export class ProjectileDamageComponent extends Component {
    /**
     * Map of damage values for each projectile type.
     * @private
     */
    private readonly damageTypes: Map<ProjectileType, number> = new Map([
        [ProjectileType.BULLET, 10],
        [ProjectileType.ROCKET, 50],
        [ProjectileType.LASER, 25],
        [ProjectileType.PLASMA, 40],
        [ProjectileType.MINE, 75],
    ]);

    /**
     * Creates a new DamageComponent.
     * @param _projectileType - The type of projectile (default is BULLET).
     */
    constructor(private _projectileType: ProjectileType) {
        super();
    }

    /**
     * Gets the current damage value.
     */
    public get damage(): number {
        return this.damageTypes.get(this._projectileType)!;
    }

    /**
     * Gets the projectile type associated with this component.
     */
    public get projectileType(): ProjectileType | undefined {
        return this._projectileType;
    }
}
