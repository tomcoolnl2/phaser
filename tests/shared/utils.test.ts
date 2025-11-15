import { describe, it, expect } from 'vitest';
import { isOutOfBounds } from '../../shared/utils';

describe('isOutOfBounds', () => {
    it('returns false for point inside bounds', () => {
        expect(isOutOfBounds({ x: 100, y: 100, bounds: { width: 200, height: 200 } })).toBe(false);
    });

    it('returns true for point outside bounds', () => {
        expect(isOutOfBounds({ x: 300, y: 100, bounds: { width: 200, height: 200 } })).toBe(true);
        expect(isOutOfBounds({ x: 100, y: 300, bounds: { width: 200, height: 200 } })).toBe(true);
        expect(isOutOfBounds({ x: -10, y: 100, bounds: { width: 200, height: 200 } })).toBe(true);
        expect(isOutOfBounds({ x: 100, y: -10, bounds: { width: 200, height: 200 } })).toBe(true);
    });

    it('respects threshold', () => {
        expect(isOutOfBounds({ x: -5, y: 100, threshold: 10, bounds: { width: 200, height: 200 } })).toBe(false);
        expect(isOutOfBounds({ x: 205, y: 100, threshold: 10, bounds: { width: 200, height: 200 } })).toBe(false);
        expect(isOutOfBounds({ x: -15, y: 100, threshold: 10, bounds: { width: 200, height: 200 } })).toBe(true);
        expect(isOutOfBounds({ x: 215, y: 100, threshold: 10, bounds: { width: 200, height: 200 } })).toBe(true);
    });
});
