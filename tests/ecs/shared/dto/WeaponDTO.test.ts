import { describe, it, expect, beforeEach } from 'vitest';
import { WeaponDTO } from '@shared/dto/WeaponDTO';
import { AmmoType, AmmoAmount, AmmoMaxAmount } from '@shared/types';

describe('WeaponDTO', () => {
	let dto: WeaponDTO;

	beforeEach(() => {
		dto = new WeaponDTO('id', 1, AmmoType.BULLET, 100);
	});

	it('constructs with correct defaults', () => {
		expect(dto.id).toBe('id');
		expect(dto.level).toBe(1);
		expect(dto.ammoType).toBe(AmmoType.BULLET);
		expect(dto.ammo).toBe(AmmoAmount.BULLET_AMMO);
		expect(dto.speed).toBe(400);
		expect(dto.damage).toBe(1);
		expect(dto.maxAmmo).toBe(AmmoMaxAmount.BULLET_MAX_AMMO);
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
		expect(dto.getAmmo(AmmoType.BULLET)).toBe(AmmoAmount.BULLET_AMMO);
	});

	it('addAmmo increases ammo (capped)', () => {
		const before = dto.ammo;
		dto.addAmmo();
		expect(dto.ammo).toBeGreaterThanOrEqual(before);
		dto.ammo = dto.maxAmmo;
		dto.addAmmo();
		expect(dto.ammo).toBe(dto.maxAmmo);
	});

	it('switchAmmoType changes selected type', () => {
		dto.switchAmmoType(AmmoType.ROCKET);
		expect(dto.ammoType).toBe(AmmoType.ROCKET);
		expect(dto.ammo).toBe(AmmoAmount.ROCKET_AMMO);
		expect(dto.speed).toBe(100);
	});

	it('getAmmoSpeed returns correct value', () => {
		expect(dto.getAmmoSpeed(AmmoType.BULLET)).toBe(400);
		expect(dto.getAmmoSpeed(AmmoType.ROCKET)).toBe(100);
	});
});
