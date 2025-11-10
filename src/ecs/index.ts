// Core ECS
export { type ComponentClass, Component, Entity, System, EntityManager } from './core';

// Types
export { CollisionLayer } from './types/CollisionLayer';

// Components
export {
    TransformComponent,
    HealthComponent,
    WeaponComponent,
    MovementComponent,
    PlayerComponent,
    UpgradesComponent,
    UpgradeType,
    type Upgrade,
    ColliderComponent,
    LegacyPlayerComponent,
} from './components';

// Systems
export { UpgradeSystem, InputSystem, MovementSystem, WeaponSystem, WeaponUpgradeSystem } from './systems';

// Factories
export { createPlayerEntity, syncPlayerToLegacy } from './core/factories';
