// Core ECS
export { 
    type ComponentClass, 
    Component, 
    Entity, 
    System, 
    EntityManager, 
    createPlayerEntity,
    createAsteroidEntity,
    createPickupEntity
} from './core';

// Types
export { CollisionLayer } from './types/CollisionLayer';
export { PickupType } from './types/PickupType';

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
    UIComponent,
    AsteroidComponent,
    PickupComponent,
} from './components';

// Systems
export { 
    UpgradeSystem, 
    InputSystem, 
    MovementSystem, 
    WeaponSystem, 
    WeaponUpgradeSystem, 
    RenderSystem,
    AsteroidSystem,
    PickupSystem
} from './systems';
