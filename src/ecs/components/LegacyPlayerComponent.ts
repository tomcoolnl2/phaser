import { Component } from '../Component';
import { Player } from '../../entities/Player';

/**
 * LegacyPlayerComponent
 * Stores a reference to the legacy Player instance during migration
 * This allows us to bridge between old and new systems
 */
export class LegacyPlayerComponent extends Component {
    public player: Player;

    constructor(player: Player) {
        super();
        this.player = player;
    }
}
