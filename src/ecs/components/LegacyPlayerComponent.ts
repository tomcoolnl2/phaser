import { Component } from '../core/Component';
import { Player } from '../../entities/Player';

/**
 * LegacyPlayerComponent - Bridge component for gradual ECS migration.
 *
 * During the migration from legacy OOP architecture to ECS, this component
 * maintains a reference to the original Player class instance. This allows
 * the new ECS systems to coexist with legacy code, enabling incremental refactoring.
 *
 * Once migration is complete, this component should be removed.
 *
 * @example
 * ```typescript
 * const legacy = new LegacyPlayerComponent(playerInstance);
 * entity.addComponent(legacy);
 *
 * // ECS systems can access legacy player for sync
 * const legacyComp = entity.getComponent(LegacyPlayerComponent);
 * legacyComp.player.ammo = 50; // sync legacy state
 * ```
 *
 * @deprecated This component is temporary and will be removed after full ECS migration
 */
export class LegacyPlayerComponent extends Component {
    /** Reference to the legacy Player instance */
    public player: Player;

    /**
     * Creates a new LegacyPlayerComponent.
     * @param player - The legacy Player instance to wrap
     */
    constructor(player: Player) {
        super();
        this.player = player;
    }
}
