import { describe, it, expect } from 'vitest';
import { CoordinatesDTO } from '@shared/dto/Coordinates.dto';

describe('CoordinatesDTO', () => {
    const coords = { x: 42, y: 99 };

    it('constructs with correct properties', () => {
        const dto = new CoordinatesDTO(coords);
        expect(dto.x).toBe(coords.x);
        expect(dto.y).toBe(coords.y);
    });

    it('has correct type identifier', () => {
        const dto = new CoordinatesDTO(coords);
        expect(dto.type).toBe('coordinates');
    });

    it('returns correct position', () => {
        const dto = new CoordinatesDTO(coords);
        expect(dto.position).toEqual(coords);
    });
});
