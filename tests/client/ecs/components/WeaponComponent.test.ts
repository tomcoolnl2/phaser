import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { WeaponDTO } from '@shared/dto/Weapon.dto';
import { ProjectileType } from '@shared/types';

// Mock Phaser group
const mockGroup = {
    // Only the minimal interface needed for construction
} as Phaser.Physics.Arcade.Group;

describe('WeaponComponent', () => {
    let dto: WeaponDTO;
    let weapon: WeaponComponent;

    beforeEach(() => {
        dto = new WeaponDTO('test-id', 1, ProjectileType.BULLET, 100);
        weapon = new WeaponComponent(mockGroup, dto, 'bullet-sprite');
        weapon.lastFired = 0;
    });

    it('constructs with correct properties', () => {
        expect(weapon.dto).toBe(dto);
        expect(weapon.bulletSpriteKey).toBe('bullet-sprite');
        expect(weapon.bullets).toBe(mockGroup);
    });

    it('canFire returns true if ammo and cooldown ok', () => {
        weapon.lastFired = Date.now() - 200;
        dto.ammo = 1;
        dto.fireRate = 100;
        expect(weapon.canFire()).toBe(true);
    });

    it('canFire returns false if no ammo', () => {
        dto.ammo = 0;
        expect(weapon.canFire()).toBe(false);
    });

    it('fire reduces ammo and updates lastFired', () => {
        dto.ammo = 2;
        const before = weapon.lastFired;
        weapon.fire();
        expect(dto.ammo).toBe(1);
        expect(weapon.lastFired).toBeGreaterThanOrEqual(before);
    });

    it('getAmmo returns current ammo', () => {
        dto.ammo = 7;
        expect(weapon.getAmmo()).toBe(7);
    });

    it('addAmmo increases ammo (capped)', () => {
        const before = dto.ammo;
        weapon.addAmmo();
        expect(dto.ammo).toBeGreaterThanOrEqual(before);
    });

    it('upgradeFireRate reduces fireRate', () => {
        const before = dto.fireRate;
        weapon.upgradeFireRate(0.2);
        expect(dto.fireRate).toBeLessThan(before);
    });

    it('upgradeDamage increases damage', () => {
        const before = dto.damage;
        weapon.upgradeDamage(2);
        expect(dto.damage).toBe(before + 2);
    });
});
