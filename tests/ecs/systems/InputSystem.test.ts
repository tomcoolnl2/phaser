import { describe, it, expect, beforeEach } from 'vitest';
import { InputSystem } from '@/ecs/systems/InputSystem';
import { Entity } from '@/ecs/core/Entity';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { MovementComponent } from '@/ecs/components/MovementComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';

// Minimal stub for Phaser global (only what InputSystem needs)
globalThis.Phaser = {
	Input: {
		Keyboard: {
			KeyCodes: { SPACE: 32 },
		},
	},
} as any;

type CursorKeys = { left?: boolean; right?: boolean; up?: boolean; down?: boolean };
function makeScene({ cursors = {}, fireKey = { isDown: false } }: { cursors?: CursorKeys; fireKey?: { isDown: boolean } } = {}) {
	return {
		input: {
			keyboard: {
				createCursorKeys: () => ({
					left: { isDown: !!cursors.left },
					right: { isDown: !!cursors.right },
					up: { isDown: !!cursors.up },
					down: { isDown: !!cursors.down },
				}),
				addKey: () => fireKey,
			},
		},
	};
}

describe('InputSystem', () => {
	let entity: Entity;
	let player: PlayerComponent;
	let movement: MovementComponent;
	let weapon: WeaponComponent;

	beforeEach(() => {
		entity = new Entity();
		player = new PlayerComponent('id', 'name', true, 1);
		movement = new MovementComponent(300, 200, 100, 300);
		weapon = new WeaponComponent({} as any, {} as any, 'key');
		entity.addComponent(player);
		entity.addComponent(movement);
		entity.addComponent(weapon);
	});

	it('updates movement and weapon for local player', () => {
		const scene = makeScene({
			cursors: { left: true, up: true },
			fireKey: { isDown: true },
		});
		const system = new InputSystem(scene as any);
		system.update(entity, 0);
		expect(movement.rotationInput).toBe(-1);
		expect(movement.thrustInput).toBe(1);
		expect(weapon.triggerPulled).toBe(true);
	});

	it('sets triggerPulled false if fireKey not pressed', () => {
		const scene = makeScene({ fireKey: { isDown: false } });
		const system = new InputSystem(scene as any);
		system.update(entity, 0);
		expect(weapon.triggerPulled).toBe(false);
	});

	it('does nothing for non-local player', () => {
		player.isLocal = false;
		const scene = makeScene();
		const system = new InputSystem(scene as any);
		system.update(entity, 0);
		expect(movement.rotationInput).toBe(0);
		expect(weapon.triggerPulled).toBe(false);
	});
});
