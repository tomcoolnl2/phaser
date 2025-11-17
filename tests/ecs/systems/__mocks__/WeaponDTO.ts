import { vi } from 'vitest';

// Minimal mock for WeaponDTO
export class MockWeaponDTO {
    ammo = 10;
    fireRate = 100;
    damage = 1;
    _ammoType = 0;
    getAmmo = vi.fn(() => 10);
    addAmmo = vi.fn();
    switchAmmoType = vi.fn();
}
