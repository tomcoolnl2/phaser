import { describe, it, expect } from 'vitest';
import { SignOnDTO } from '@shared/dto/SignOn.dto';

describe('SignOnDTO', () => {
    it('constructs with correct properties', () => {
        const dto = new SignOnDTO({ name: 'PlayerOne', width: 10, height: 20 });
        expect(dto.name).toBe('PlayerOne');
        expect(dto.width).toBe(10);
        expect(dto.height).toBe(20);
        expect(dto.type).toBe('sign-on');
    });
});
