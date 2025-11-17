import { describe, it, expect } from 'vitest';
import { AsteroidComponent } from '@/ecs/components/AsteroidComponent';

describe('AsteroidComponent', () => {
    it('constructs with given id', () => {
        const asteroid = new AsteroidComponent('asteroid-123');
        expect(asteroid.id).toBe('asteroid-123');
    });
});
