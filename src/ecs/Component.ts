/**
 * Component - Base class for all ECS components.
 * 
 * Components are pure data containers with no logic. They store state that Systems
 * operate on. This separation of data and logic is a core principle of ECS architecture.
 * 
 * All components should extend this class and add their own properties.
 * 
 * @example
 * ```typescript
 * export class HealthComponent extends Component {
 *     constructor(
 *         public currentHealth: number,
 *         public maxHealth: number = 100
 *     ) {
 *         super();
 *     }
 * }
 * ```
 */
export abstract class Component {
    /** Whether this component is currently enabled and should be processed */
    public enabled: boolean = true;
}

/**
 * ComponentClass - Type for component class constructors.
 * 
 * This type uses `never[]` for constructor arguments to allow maximum flexibility.
 * This is a standard pattern in ECS frameworks (Unity DOTS, Bevy, etc.) that allows
 * components to have any constructor signature while maintaining type safety.
 * 
 * @template T - The component type (must extend Component)
 * 
 * @see {@link https://www.typescriptlang.org/docs/handbook/2/generics.html TypeScript Generics}
 */
export type ComponentClass<T extends Component = Component> = abstract new (...args: never[]) => T;
