import { describe, it, expect } from 'vitest';
import { isOutOfBounds } from '@shared/utils';

describe('isOutOfBounds', () => {
	const bounds = { width: 100, height: 100 };

	it('returns false for a point inside bounds', () => {
		expect(isOutOfBounds({ x: 50, y: 50, bounds })).toBe(false);
	});

	it('returns true for a point left of bounds', () => {
		expect(isOutOfBounds({ x: -1, y: 50, bounds })).toBe(true);
	});

	it('returns true for a point right of bounds', () => {
		expect(isOutOfBounds({ x: 101, y: 50, bounds })).toBe(true);
	});

	it('returns true for a point above bounds', () => {
		expect(isOutOfBounds({ x: 50, y: -1, bounds })).toBe(true);
	});

	it('returns true for a point below bounds', () => {
		expect(isOutOfBounds({ x: 50, y: 101, bounds })).toBe(true);
	});

	it('respects the threshold parameter', () => {
		expect(isOutOfBounds({ x: -5, y: 50, threshold: 10, bounds })).toBe(false);
		expect(isOutOfBounds({ x: -11, y: 50, threshold: 10, bounds })).toBe(true);
		expect(isOutOfBounds({ x: 105, y: 50, threshold: 5, bounds })).toBe(false);
		expect(isOutOfBounds({ x: 106, y: 50, threshold: 5, bounds })).toBe(true);
	});
});

