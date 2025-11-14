import { describe, it, expect } from 'vitest';
import { UpgradeSystem } from '@/ecs/systems/UpgradeSystem';
import { Entity } from '@/ecs/core/Entity';
import { UpgradesComponent, UpgradeType } from '@/ecs/components/UpgradesComponent';
import { GameScene } from '@/scenes/GameScene';

const mockScene = {} as GameScene;

describe('UpgradeSystem', () => {
	it('should construct without error', () => {
		expect(() => new UpgradeSystem(mockScene)).not.toThrow();
	});

	it('should return required components', () => {
		const system = new UpgradeSystem(mockScene);
		expect(system.getRequiredComponents()).toContain(UpgradesComponent);
	});

	it('should not apply upgrade if UpgradesComponent missing', () => {
		const system = new UpgradeSystem(mockScene);
		const entity = new Entity();
		expect(system.applyUpgrade(entity, UpgradeType.DAMAGE)).toBe(false);
	});

	it('should not apply upgrade if cannot upgrade', () => {
		class MockUpgradesComponent extends UpgradesComponent {
			canUpgrade() { return false; }
		}
		const system = new UpgradeSystem(mockScene);
		const entity = new Entity();
		entity.addComponent(new MockUpgradesComponent());
		expect(system.applyUpgrade(entity, UpgradeType.DAMAGE)).toBe(false);
	});
});
