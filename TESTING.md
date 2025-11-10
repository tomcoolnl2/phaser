# Testing Guide

## Running Tests

Vitest has been configured for this project with watch mode enabled by default.

### Test Commands

```bash
# Run tests in watch mode (reruns on file changes) ⚡
npm test

# Run tests with UI dashboard (interactive)
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage report
npm run test:coverage
```

### Watch Mode + HMR

**The `npm test` command runs in watch mode automatically!** This means:

-   ✅ Tests rerun whenever you save a source file or test file
-   ✅ Works alongside HMR (Hot Module Reload) from `npm run dev`
-   ✅ Fast feedback loop - see test results in seconds
-   ✅ Only reruns affected tests (smart mode)

**Recommended Workflow:**

```bash
# Terminal 1: Run your dev server with HMR
npm run dev

# Terminal 2: Run tests in watch mode
npm test

# Terminal 3: Run your game server (if needed)
npm run server:watch
```

Now when you edit code:

-   HMR updates your browser instantly
-   Tests rerun automatically
-   You get immediate feedback on both UI and logic

## Test Structure

Tests are located in the `test/` directory at the project root, mirroring the `src/` structure:

```
test/
└── ecs/
    ├── Entity.test.ts
    └── EntityManager.test.ts

src/
└── ecs/
    ├── Entity.ts
    └── EntityManager.ts
```

## Example Tests

### Entity Tests

Tests for the core ECS Entity class covering:

-   Entity creation and initialization
-   Component management (add, remove, get, check)
-   Active state management
-   Entity destruction

### EntityManager Tests

Tests for the EntityManager covering:

-   Entity creation and registration
-   Entity queries by components
-   System registration and updates
-   Update loop behavior
-   Cleanup and destruction

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('MyClass', () => {
    let instance: MyClass;

    beforeEach(() => {
        instance = new MyClass();
    });

    it('should do something', () => {
        const result = instance.doSomething();
        expect(result).toBe(expectedValue);
    });
});
```

### Testing Components

```typescript
import { describe, it, expect } from 'vitest';
import { TransformComponent } from '../components/TransformComponent';

describe('TransformComponent', () => {
    it('should store sprite reference', () => {
        const mockSprite = {} as Phaser.GameObjects.Sprite;
        const component = new TransformComponent(mockSprite);

        expect(component.sprite).toBe(mockSprite);
    });
});
```

### Mocking Phaser

For tests that need Phaser objects, create simple mocks:

```typescript
const createMockSprite = () =>
    ({
        x: 0,
        y: 0,
        rotation: 0,
        setPosition: vi.fn(),
        setRotation: vi.fn(),
    }) as unknown as Phaser.GameObjects.Sprite;
```

## Test-Driven Development (TDD)

### TDD Workflow

1. **Write a failing test** - Define the expected behavior

```typescript
it('should move entity based on velocity', () => {
    const entity = createEntity();
    system.update(entity, 16);
    expect(getPosition(entity)).toEqual({ x: 16, y: 0 });
});
```

2. **Write minimal code** - Make the test pass

```typescript
public update(entity: Entity, delta: number): void {
    const transform = entity.getComponent(TransformComponent);
    const velocity = entity.getComponent(VelocityComponent);
    transform.sprite.x += velocity.x * delta;
}
```

3. **Refactor** - Improve the code while keeping tests green

4. **Repeat** - Add more tests for edge cases and new features

### TDD Benefits

-   ✅ Better design - Writing tests first forces you to think about the API
-   ✅ Higher confidence - Every feature is tested from the start
-   ✅ Living documentation - Tests show how code should be used
-   ✅ Easier refactoring - Tests catch regressions immediately

## Best Practices

### Good Tests Are:

-   **Fast** - Run quickly to enable rapid feedback
-   **Isolated** - Don't depend on other tests or external state
-   **Repeatable** - Same results every time
-   **Self-validating** - Clear pass/fail, no manual inspection
-   **Timely** - Written at the same time as the code

### Test Coverage

Aim to test:

-   ✅ Happy path - Normal, expected usage
-   ✅ Edge cases - Boundary conditions, empty arrays, null values
-   ✅ Error conditions - Invalid input, missing dependencies
-   ✅ State changes - Before/after comparisons

### What to Mock

Mock:

-   External dependencies (network, filesystem)
-   Phaser objects (scene, sprites) when testing logic only
-   Time-dependent operations (Date.now, setTimeout)

Don't mock:

-   Your own code (test real implementations)
-   Simple data structures
-   Pure functions

## Continuous Testing

### Watch Mode

Run `npm test` to start watch mode. Vitest will:

-   Run tests automatically when files change
-   Show which tests failed
-   Provide fast feedback loop

### UI Mode

Run `npm run test:ui` to open the Vitest UI:

-   Visual test runner with filtering
-   Detailed error messages and stack traces
-   Coverage visualization
-   Great for debugging failing tests

## Next Steps

1. Add tests for all ECS components
2. Test ECS systems (InputSystem, MovementSystem, WeaponSystem)
3. Add integration tests for entity creation factories
4. Test game scene logic
5. Add tests before implementing new features (TDD)
