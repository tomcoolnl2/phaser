import { describe, it, expect } from 'vitest';
import { PlayerDTO } from '@shared/dto/Player.dto';
import { PlayerLevel } from '@shared/model';

describe('PlayerDTO', () => {
    const config = {
        name: 'PlayerOne',
        x: 10,
        y: 20,
        spriteKey: 'player-sprite',
        isLocal: true,
        level: 1 as PlayerLevel,
        health: 100,
        maxHealth: 100,
        angle: Math.PI / 2,
    };

    it('constructs with correct properties', () => {
        const dto = new PlayerDTO(config);
        expect(dto.name).toBe(config.name);
        expect(dto.x).toBe(config.x);
        expect(dto.y).toBe(config.y);
        expect(dto.spriteKey).toBe(config.spriteKey);
        expect(dto.isLocal).toBe(config.isLocal);
        expect(dto.level).toBe(config.level);
        expect(dto.health).toBe(config.maxHealth); // Note: health uses maxHealth default
        expect(dto.maxHealth).toBe(config.maxHealth);
        expect(dto.angle).toBe(config.angle);
        expect(dto.id).toBeDefined();
    });

    it('has correct type identifier', () => {
        const dto = new PlayerDTO(config);
        expect(dto.type).toBe('player');
    });

    it('inherits position from CoordinatesDTO', () => {
        const dto = new PlayerDTO(config);
        expect(dto.position).toEqual({ x: config.x, y: config.y });
    });
});
