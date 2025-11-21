import { describe, it, expect } from 'vitest';
import { AsteroidDTO, AsteroidSize, AsteroidCauseOfDeath, AsteroidHitDTO } from '@shared/dto/Asteroid.dto';

describe('AsteroidDTO', () => {
    const config = {
        x: 100,
        y: 200,
        maxHealth: 50,
        size: AsteroidSize.LARGE,
        dx: 1,
        dy: -1,
        causeOfDeath: AsteroidCauseOfDeath.HIT,
    };

    it('constructs with correct properties', () => {
        const dto = new AsteroidDTO(config);
        expect(dto.x).toBe(config.x);
        expect(dto.y).toBe(config.y);
        expect(dto.maxHealth).toBe(config.maxHealth);
        expect(dto.health).toBe(config.maxHealth);
        expect(dto.size).toBe(config.size);
        expect(dto.dx).toBe(config.dx);
        expect(dto.dy).toBe(config.dy);
        expect(dto.causeOfDeath).toBe(config.causeOfDeath);
        expect(dto.id).toBeDefined();
    });

    it('has correct type identifier', () => {
        const dto = new AsteroidDTO(config);
        expect(dto.type).toBe('asteroid');
    });

    it('returns correct position', () => {
        const dto = new AsteroidDTO(config);
        expect(dto.position).toEqual({ x: config.x, y: config.y });
    });
});

describe('AsteroidHitDTO', () => {
    const hitConfig = {
        asteroidId: 'asteroid-123',
        damage: 10,
    };

    it('constructs with correct properties', () => {
        const hitDto = new AsteroidHitDTO(hitConfig);
        expect(hitDto.asteroidId).toBe(hitConfig.asteroidId);
        expect(hitDto.damage).toBe(hitConfig.damage);
    });

    it('has correct type identifier', () => {
        const hitDto = new AsteroidHitDTO(hitConfig);
        expect(hitDto.type).toBe('asteroid-hit');
    });
});
