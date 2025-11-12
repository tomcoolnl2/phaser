import { describe, it, expect, beforeEach } from 'vitest';
import { HealthManager } from '../../server/HealthManager';

describe('HealthManager', () => {
  let health: HealthManager;

  beforeEach(() => {
    health = new HealthManager();
  });

  it('sets and gets health', () => {
    health.setHealth('id', 5, 10);
    expect(health.getHealth('id')).toBe(5);
    expect(health.getMaxHealth('id')).toBe(10);
  });

  it('damages and heals', () => {
    health.setHealth('id', 10, 10);
    health.damage('id', 3);
    expect(health.getHealth('id')).toBe(7);
    health.heal('id', 2);
    expect(health.getHealth('id')).toBe(9);
    health.heal('id', 10);
    expect(health.getHealth('id')).toBe(10); // capped at max
  });

  it('isDead returns true when health <= 0', () => {
    health.setHealth('id', 1, 10);
    health.damage('id', 1);
    expect(health.isDead('id')).toBe(true);
    health.setHealth('id', 0, 10);
    expect(health.isDead('id')).toBe(true);
  });

  it('removes health tracking', () => {
    health.setHealth('id', 5, 10);
    health.remove('id');
    expect(health.getHealth('id')).toBe(0);
    expect(health.getMaxHealth('id')).toBe(0);
  });
});
