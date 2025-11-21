import { describe, it, expect, beforeEach } from 'vitest';
import { WeaponDTO } from '@shared/dto/Weapon.dto';
import { ProjectileType, ProjectileRefillAmount, ProjectileMaxAmount } from '@shared/types';

describe('WeaponDTO', () => {
    let dto: WeaponDTO;

    beforeEach(() => {
        dto = new WeaponDTO({ id: 'id', ownerId: 'player1', level: 1, ammoType: ProjectileType.BULLET, fireRate: 100 });
    });

    it('constructs with correct defaults', () => {
        expect(dto.id).toBe('id');
        expect(dto.level).toBe(1);
        expect(dto.ammoType).toBe(ProjectileType.BULLET);
        expect(dto.ammo).toBe(ProjectileRefillAmount.BULLET);
        expect(dto.speed).toBe(650);
        expect(dto.damage).toBe(1);
        expect(dto.maxAmmo).toBe(ProjectileMaxAmount.BULLET);
    });

    it('can get and set ammo (clamped)', () => {
        dto.ammo = 5;
        expect(dto.ammo).toBe(5);
        dto.ammo = 9999;
        expect(dto.ammo).toBeLessThanOrEqual(dto.maxAmmo);
        dto.ammo = -10;
        expect(dto.ammo).toBeGreaterThanOrEqual(0);
    });

    it('can get and set speed', () => {
        // @ts-expect-error: speed setter is private
        dto.speed = 123;
        expect(dto.speed).toBe(123);
    });

    it('can get and set damage', () => {
        dto.damage = 7;
        expect(dto.damage).toBe(7);
    });

    it('getAmmo returns correct value for type', () => {
        expect(dto.getAmmo(ProjectileType.BULLET)).toBe(ProjectileRefillAmount.BULLET);
    });

    it('addAmmo increases ammo (capped)', () => {
        const before = dto.ammo;
        dto.addAmmo();
        expect(dto.ammo).toBeGreaterThanOrEqual(before);
        dto.ammo = dto.maxAmmo;
        dto.addAmmo();
        expect(dto.ammo).toBe(dto.maxAmmo);
    });

    it('switchProjectileType changes selected type', () => {
        dto.switchProjectileType(ProjectileType.ROCKET);
        expect(dto.ammoType).toBe(ProjectileType.ROCKET);
        expect(dto.ammo).toBe(ProjectileRefillAmount.ROCKET);
        expect(dto.speed).toBe(100);
    });

    it('getAmmoSpeed returns correct value', () => {
        expect(dto.getAmmoSpeed(ProjectileType.BULLET)).toBe(650);
        expect(dto.getAmmoSpeed(ProjectileType.ROCKET)).toBe(100);
    });
});
