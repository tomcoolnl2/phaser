// Core ECS
export { Component } from './Component';
export type { ComponentClass } from './Component';
export { Entity } from './Entity';
export { System } from './System';
export { EntityManager } from './EntityManager';

// Components
export { TransformComponent } from './components/TransformComponent';
export { HealthComponent } from './components/HealthComponent';
export { WeaponComponent } from './components/WeaponComponent';
export { MovementComponent } from './components/MovementComponent';
export { PlayerComponent } from './components/PlayerComponent';
export { UpgradesComponent, UpgradeType } from './components/UpgradesComponent';
export type { Upgrade } from './components/UpgradesComponent';
export { ColliderComponent } from './components/ColliderComponent';
export { LegacyPlayerComponent } from './components/LegacyPlayerComponent';

// Systems
export { UpgradeSystem } from './systems/UpgradeSystem';
export { InputSystem } from './systems/InputSystem';
export { MovementSystem } from './systems/MovementSystem';
export { WeaponSystem } from './systems/WeaponSystem';
export { WeaponUpgradeSystem } from './systems/WeaponUpgradeSystem';

// Factories
export { createPlayerEntity, syncPlayerToLegacy } from './factories';
