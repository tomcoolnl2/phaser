import { Component } from '../core/Component';

/**
 * Component that marks an entity as an asteroid with specific properties.
 *
 * Stores asteroid-specific data such as its unique identifier. Used in conjunction
 * with other components (Transform, Health, Collider) to create a complete asteroid entity.
 *
 * @example
 * ```typescript
 * const asteroidComp = new AsteroidComponent('asteroid-123');
 * entity.addComponent(asteroidComp);
 * ```
 */
export class AsteroidComponent extends Component {
    /**
     * Creates a new AsteroidComponent.
     * @param asteroidId - Unique identifier for the asteroid
     */
    constructor(public asteroidId: string) {
        super();
    }
}
