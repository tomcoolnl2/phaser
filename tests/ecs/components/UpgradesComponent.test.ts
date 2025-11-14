import { describe, it, expect } from 'vitest';
import { UpgradesComponent, UpgradeType } from '@/ecs/components/UpgradesComponent';

describe('UpgradesComponent', () => {
	it('should initialize all upgrade types at level 0', () => {
		const upgrades = new UpgradesComponent();
		for (const type of Object.values(UpgradeType)) {
			expect(upgrades.getUpgradeLevel(type as UpgradeType)).toBe(0);
		}
	});

	it('should allow upgrade if below max level', () => {
		const upgrades = new UpgradesComponent();
		expect(upgrades.canUpgrade(UpgradeType.DAMAGE)).toBe(true);
	});

	it('should increment level on upgrade', () => {
		const upgrades = new UpgradesComponent();
		upgrades.upgrade(UpgradeType.DAMAGE);
		expect(upgrades.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(1);
	});

	it('should not upgrade past max level', () => {
		const upgrades = new UpgradesComponent();
		const max = upgrades.getUpgrade(UpgradeType.DAMAGE)?.maxLevel || 0;
		for (let i = 0; i < max; i++) {
			upgrades.upgrade(UpgradeType.DAMAGE);
		}
		expect(upgrades.upgrade(UpgradeType.DAMAGE)).toBe(false);
	});
});
