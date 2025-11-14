import { describe, it, expect, beforeEach } from 'vitest';
import { GameConfig } from '@shared/config';
import { PlayerLevel } from '@shared/model';
import { PlayerDTO } from '@shared/dto/PlayerDTO';

describe('PlayerDTO', () => {
	let dto: PlayerDTO;

	beforeEach(() => {
		dto = new PlayerDTO('id', 'Alice', 10, 20, 'sprite', true);
	});

	it('constructs with correct properties', () => {
		expect(dto.id).toBe('id');
		expect(dto.name).toBe('Alice');
		expect(dto.x).toBe(10);
		expect(dto.y).toBe(20);
		expect(dto.spriteKey).toBe('sprite');
		expect(dto.isLocal).toBe(true);
		expect(dto.level).toBe(GameConfig.player.startingLevel);
	});

	it('gets and sets level (clamped)', () => {
		dto.level = 3;
		expect(dto.level).toBe(3);
		dto.level = 999 as PlayerLevel;
		expect(dto.level).toBeLessThanOrEqual(GameConfig.player.playerMaxLevel);
		dto.level = -5 as PlayerLevel;
		expect(dto.level).toBeGreaterThanOrEqual(0);
	});

	it('returns correct position', () => {
		expect(dto.position).toEqual({ x: 10, y: 20 });
	});
});
