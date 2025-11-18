import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { ScoreSystem } from '@/ecs/systems/ScoreSystem';
import { Entity } from '@/ecs/core/Entity';
import { ScoreComponent } from '@/ecs/components/ScoreComponent';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { GameScene } from '@/scenes/GameScene';

const mockScene = {} as GameScene;

// Provide a global window mock for dispatchEvent in Node/Vitest
let originalWindow: Window & typeof globalThis;
beforeAll(() => {
    originalWindow = global.window;
    global.window = {
        dispatchEvent: vi.fn(),
    } as unknown as Window & typeof globalThis;
});
afterAll(() => {
    global.window = originalWindow;
});

beforeEach(() => {
    // Clear mock call count before each test
    (window.dispatchEvent as ReturnType<typeof vi.fn>).mockClear();
});

describe('ScoreSystem', () => {
    let system: ScoreSystem;
    let entity: Entity;
    let scoreComponent: ScoreComponent;
    let playerComponent: PlayerComponent;

    beforeEach(() => {
        system = new ScoreSystem(mockScene);
        entity = new Entity();
        scoreComponent = new ScoreComponent();
        playerComponent = new PlayerComponent('id', 'name', true); // isLocal = true
        entity.addComponent(scoreComponent);
        entity.addComponent(playerComponent);
    });

    it('should require ScoreComponent and PlayerComponent', () => {
        const required = system.getRequiredComponents();
        expect(required).toContain(ScoreComponent);
        expect(required).toContain(PlayerComponent);
    });

    it('should dispatch updatePlayerScore event for local player', () => {
        scoreComponent.score = 42;
        system.update(entity, 0);
        expect(window.dispatchEvent).toHaveBeenCalledWith(new CustomEvent('updatePlayerScore', { detail: { score: 42 } }));
    });

    it('should not dispatch event if player is not local', () => {
        playerComponent.isLocal = false;
        system.update(entity, 0);
        expect(window.dispatchEvent).not.toHaveBeenCalled();
    });
});
