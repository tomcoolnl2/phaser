import { describe, it, expect } from 'vitest';
import { ProjectileDTO } from '@shared/dto/Projectile.dto';
import { ProjectileType } from '@shared/types';

describe('ProjectileDTO', () => {
    const config = {
        ownerId: 'player1',
        spriteKey: 'bullet-sprite',
        projectileType: ProjectileType.BULLET,
        collisionRadius: 10,
        damage: 2,
        x: 100,
        y: 200,
        dx: 1,
        dy: 0,
        speed: 500,
    };

    it('constructs with correct properties', () => {
        const dto = new ProjectileDTO(config);
        expect(dto.ownerId).toBe(config.ownerId);
        expect(dto.spriteKey).toBe(config.spriteKey);
        expect(dto.projectileType).toBe(config.projectileType);
        expect(dto.collisionRadius).toBe(config.collisionRadius);
        expect(dto.damage).toBe(config.damage);
        expect(dto.x).toBe(config.x);
        expect(dto.y).toBe(config.y);
        expect(dto.dx).toBe(config.dx);
        expect(dto.dy).toBe(config.dy);
        expect(dto.speed).toBe(config.speed);
        expect(dto.id).toBeDefined();
    });

    it('has correct type identifier', () => {
        const dto = new ProjectileDTO(config);
        expect(dto.type).toBe('projectile');
    });

    it('inherits position from CoordinatesDTO', () => {
        const dto = new ProjectileDTO(config);
        expect(dto.position).toEqual({ x: config.x, y: config.y });
    });
});
