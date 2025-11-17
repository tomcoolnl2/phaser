
import { PickupType } from '@shared/dto/Pickup.dto';
import { Events } from '@shared/events';
import { PickupComponent } from '@/ecs/components/PickupComponent';
import { ScoreComponent } from '@/ecs/components/ScoreComponent';
import { System } from '@/ecs/core/System';
import { Entity } from '@/ecs/core/Entity';
import { ComponentClass } from '@/ecs/core/Component';
import { GameScene } from '@/scenes/GameScene';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { HealthComponent } from '@/ecs/components/HealthComponent';

/**
 * System responsible for player-specific visuals and lifecycle (death animation, cleanup).
 * Keeps player-related presentation logic in one place instead of scattering in the scene.
 */
/**
 * PlayerSystem
 *
 * System responsible for player-specific visuals, pickup handling, and lifecycle (death animation, cleanup).
 * Keeps player-related presentation logic in one place instead of scattering in the scene.
 * Handles all player pickup types (star, ammo, health) in ECS style.
 */
export class PlayerSystem extends System {
    /**
     * Creates a new PlayerSystem.
     * @param scene - The Phaser scene this system operates in
     */
    constructor(protected scene: GameScene) {
        super(scene);
    }

    // --- ECS/System Methods ---

    /**
     * Returns the required components for this system to operate on entities.
     * @returns Array of required component classes
     */
    public getRequiredComponents(): ComponentClass[] {
        return [TransformComponent, PlayerComponent];
    }

    /**
     * Called every frame by the ECS manager. Handles per-frame player visuals if needed.
     */
    public update(): void {
        // Player visuals are event driven; nothing to update every frame for now.
    }

    // --- Utility Methods ---

    /**
     * Destroy a player by id: play explosion, cleanup sprite and entity.
     * Safe to call for both local and remote players.
     * @param id - The player entity ID to destroy
     */
    public destroyPlayerById(id: string): void {
        const entities = this.scene.entityManager.queryEntities(PlayerComponent, TransformComponent);
        const entity = entities.find((e: Entity) => {
            const player = e.getComponent(PlayerComponent);
            return player && player.id === id;
        });

        if (!entity) return;

        const transform = entity.getComponent(TransformComponent);
        if (!transform || !transform.sprite) {
            this.scene.entityManager.removeEntity(entity.id);
            return;
        }

        // Play explosion at player's position
        const explosion = this.scene.add.sprite(transform.sprite.x, transform.sprite.y, 'kaboom');
        if (explosion.anims) {
            explosion.play('explode');
            explosion.once('animationcomplete', () => explosion.destroy());
        } else {
            explosion.destroy();
        }

        // Destroy sprite and entity
        transform.sprite.destroy();
        this.scene.entityManager.removeEntity(entity.id);
    }

    // --- Pickup Handlers ---

    /**
     * Handles the logic for a player collecting a coin pickup: adds score, emits event, and removes pickup.
     * @param playerEntity - The player entity collecting the coin
     * @param pickupEntity - The pickup entity (should be a coin)
     * @param scene - The current GameScene (for socket, entityManager, etc.)
     */
    public handleCoinPickup(playerEntity: Entity, pickupEntity: Entity, scene: GameScene): void {
        const playerComponent = playerEntity.getComponent(PlayerComponent);
        if (!playerComponent) return;
        const pickupTransform = pickupEntity.getComponent(TransformComponent);
        if (!pickupTransform) return;

        const scoreComponent = playerEntity.getComponent(ScoreComponent);
        if (scoreComponent) {
            const pickupComponent = pickupEntity.getComponent(PickupComponent);
            if (pickupComponent?.type === PickupType.COIN) {
                scoreComponent.add(pickupComponent.value);
            }
        }

        // Emit pickup event
        const coinPickupDTO = {
            type: PickupType.COIN,
            id: playerComponent.id,
            x: pickupTransform.sprite.x,
            y: pickupTransform.sprite.y,
            points: 50,
        };

        const request = { ok: true, dto: coinPickupDTO };
        try {
            scene.emitPlayerPickup(request);
            scene.destroyPickupEntity(coinPickupDTO.id);
        } catch (error) {
            if (scene.handleSocketError) {
                scene.handleSocketError(Events.Player.pickup, error);
            }
        }
    }

    /**
     * Handles the logic for a player collecting an ammo pickup: adds ammo, levels up, emits event, and removes pickup.
     * @param playerEntity - The player entity collecting the ammo
     * @param pickupEntity - The pickup entity (should be ammo)
     * @param scene - The current GameScene (for socket, entityManager, etc.)
     */
    public handleAmmoPickup(playerEntity: Entity, pickupEntity: Entity, scene: GameScene): void {
        const playerComponent = playerEntity.getComponent(PlayerComponent);
        if (!playerComponent) {
            return;
        }
        
        
        const pickupTransform = pickupEntity.getComponent(TransformComponent);
        const pickupComponent = pickupEntity.getComponent(PickupComponent);
        if (!pickupTransform || !pickupComponent) {
            return;
        }

        const weapon = playerEntity.getComponent(WeaponComponent);
        if (weapon) {
            weapon.addAmmo();
            const newLevel = playerComponent.levelUp();
            weapon.setDamageForLevel(newLevel);
        }
        
        // Emit pickup event
        const ammoPickupDTO = {
            type: PickupType.AMMO,
            id: playerComponent.id,
            amount: pickupComponent.value,
            x: pickupTransform.sprite.x,
            y: pickupTransform.sprite.y,
        };
        const request = { ok: true, dto: ammoPickupDTO };
        try {
            scene.emitPlayerPickup(request);
            scene.destroyPickupEntity(ammoPickupDTO.id);
        } catch (error) {
            if (scene.handleSocketError) scene.handleSocketError(Events.Player.pickup, error);
        }
    }

    /**
     * Handles the logic for a player collecting a health pickup: heals, emits event, and removes pickup.
     * @param playerEntity - The player entity collecting the health pickup
     * @param pickupEntity - The pickup entity (should be health)
     * @param scene - The current GameScene (for socket, entityManager, etc.)
     */
    public handleHealthPickup(playerEntity: Entity, pickupEntity: Entity, scene: GameScene): void {
        const playerComponent = playerEntity.getComponent(PlayerComponent);
        if (!playerComponent) {
            return;
        }
        const pickupTransform = pickupEntity.getComponent(TransformComponent);
        const pickupComponent = pickupEntity.getComponent(PickupComponent);
        if (!pickupTransform || !pickupComponent) {
            return;
        }
        const health = playerEntity.getComponent(HealthComponent);
        if (health) {
            health.heal(pickupComponent.value);
        }
        // Emit pickup event
        const healthPickupDTO = {
            type: PickupType.HEALTH,
            id: playerComponent.id,
            amount: pickupComponent.value,
            x: pickupTransform.sprite.x,
            y: pickupTransform.sprite.y,
        };
        const request = { ok: true, dto: healthPickupDTO };
        try {
            scene.emitPlayerPickup(request);
            scene.destroyPickupEntity(healthPickupDTO.id);
        } catch (error) {
            if (scene.handleSocketError) scene.handleSocketError(Events.Player.pickup, error);
        }
    }
}
