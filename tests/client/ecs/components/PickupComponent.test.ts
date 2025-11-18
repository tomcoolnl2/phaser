import { describe, it, expect } from 'vitest';
import { PickupComponent } from '@/ecs/components/PickupComponent';
import { PickupType } from '@shared/dto/Pickup.dto';

describe('PickupComponent', () => {
    it('constructs with given type and value', () => {
        const pickup = new PickupComponent(PickupType.HEALTH, 42);
        expect(pickup.type).toBe(PickupType.HEALTH);
        expect(pickup.value).toBe(42);
    });

    it('uses default values if not provided', () => {
        const pickup = new PickupComponent();
        expect(pickup.type).toBe(PickupType.AMMO);
        expect(pickup.value).toBe(10);
    });
});
