/**
 * Base Component class
 * Components are pure data containers with no logic
 */
export abstract class Component {
    public enabled: boolean = true;
}

/**
 * Component class constructor type
 * Uses abstract new to allow any constructor signature while maintaining type safety
 * This pattern is used by major ECS frameworks (Unity DOTS, Bevy, etc.)
 */
export type ComponentClass<T extends Component = Component> = abstract new (...args: never[]) => T;
