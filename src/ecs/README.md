# Entity Component System (ECS)

A flexible ECS architecture for the Phaser multiplayer game that enables ship upgrades, modular entity design, and easy extensibility.

## Architecture

### Core Classes

-   **Entity**: A container for components with a unique ID
-   **Component**: Pure data containers (no logic)
-   **System**: Contains logic that operates on entities with specific components
-   **EntityManager**: Central manager for entities and systems

## Components

### TransformComponent

Wraps a Phaser sprite with position, rotation data.

### HealthComponent

```typescript
const health = new HealthComponent(10); // 10 max HP
health.takeDamage(3);
health.isDead(); // false
```

### WeaponComponent

Handles shooting, ammo, fire rate, damage.

```typescript
const weapon = new WeaponComponent(bullets, 10, 50, 250, 400, 1);
// bullets group, ammo, maxAmmo, fireRate, bulletSpeed, damage
```

### MovementComponent

Velocity, acceleration, drag, rotation speed.

### PlayerComponent

Marks entity as player-controlled, stores player data.

### UpgradesComponent

Tracks all upgrades applied to an entity.

```typescript
const upgrades = new UpgradesComponent();
upgrades.canUpgrade(UpgradeType.FIRE_RATE); // true
upgrades.upgrade(UpgradeType.FIRE_RATE);
```

## Usage Example

### Creating an Entity with Components

```typescript
// In GameScene
const entityManager = new EntityManager(this);

// Create player entity
const playerEntity = entityManager.createEntity('player_1');

playerEntity
    .addComponent(new TransformComponent(sprite))
    .addComponent(new HealthComponent(10))
    .addComponent(new WeaponComponent(bullets, 10, 50, 250, 400, 1))
    .addComponent(new MovementComponent(300, 200, 0.97, 0.03))
    .addComponent(new PlayerComponent('uuid123', 'PlayerName', true))
    .addComponent(new UpgradesComponent());
```

### Adding Systems

```typescript
const upgradeSystem = new UpgradeSystem(this);
entityManager.addSystem(upgradeSystem);

// In update loop
entityManager.update(delta);
```

### Applying Upgrades

```typescript
const upgradeSystem = entityManager.getSystems()[0] as UpgradeSystem;

// Apply fire rate upgrade
upgradeSystem.applyUpgrade(playerEntity, UpgradeType.FIRE_RATE);

// Check available upgrades
const available = upgradeSystem.getAvailableUpgrades(playerEntity);
console.log(available); // [UpgradeType.DAMAGE, UpgradeType.SPEED, ...]
```

### Querying Entities

```typescript
// Get all entities with health and weapon
const combatEntities = entityManager.queryEntities(HealthComponent, WeaponComponent);

// Get all player entities
const players = entityManager.queryEntities(PlayerComponent, TransformComponent);
```

## Available Upgrades

| Upgrade Type   | Max Level | Effect                   |
| -------------- | --------- | ------------------------ |
| FIRE_RATE      | 5         | -10% fire rate per level |
| DAMAGE         | 10        | +1 damage per level      |
| SPEED          | 5         | +15% speed per level     |
| HEALTH         | 5         | +2 max HP per level      |
| MAX_AMMO       | 10        | +10 max ammo per level   |
| ROTATION_SPEED | 3         | +20% rotation per level  |

## Migration Guide

### Current System (Without ECS)

```typescript
class Player {
    public ammo: number;
    public health: number;
    // ... logic mixed with data
}
```

### New System (With ECS)

```typescript
// Data in components
const entity = createEntity()
  .addComponent(new WeaponComponent(...))
  .addComponent(new HealthComponent(...))

// Logic in systems
class CombatSystem extends System {
  update(entity: Entity) {
    const weapon = entity.getComponent(WeaponComponent)
    // ... combat logic
  }
}
```

## Benefits

1. **Modularity**: Mix and match components to create different entity types
2. **Upgrades**: Easy to add/modify upgrades without changing core classes
3. **Extensibility**: Add new components/systems without affecting existing code
4. **Testing**: Test components and systems independently
5. **Performance**: Query only entities with needed components

## Next Steps

1. Gradually migrate Player and Asteroid classes to use ECS
2. Create pickup entities with components
3. Add turret entities with AI components
4. Implement upgrade UI to purchase upgrades
5. Create more systems (AI, particle effects, etc.)
