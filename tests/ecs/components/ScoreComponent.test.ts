import { describe, it, expect } from 'vitest';
import { ScoreComponent } from '@/ecs/components/ScoreComponent';

describe('ScoreComponent', () => {
    it('constructs with default score 0', () => {
        const score = new ScoreComponent();
        expect(score.score).toBe(0);
    });

    it('constructs with given initial score', () => {
        const score = new ScoreComponent(42);
        expect(score.score).toBe(42);
    });

    it('add increases score', () => {
        const score = new ScoreComponent(10);
        score.add(5);
        expect(score.score).toBe(15);
    });
});
