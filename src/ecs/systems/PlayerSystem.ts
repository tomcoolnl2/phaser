import { System } from '@/ecs/core/System';
import { Entity } from '@/ecs/core/Entity';
import { ComponentClass } from '@/ecs/core/Component';
import { GameScene } from '@/scenes/GameScene';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';

/**
 * System responsible for player-specific visuals and lifecycle (death animation, cleanup).
 * Keeps player-related presentation logic in one place instead of scattering in the scene.
 */
export class PlayerSystem extends System {
    constructor(protected scene: GameScene) {
        super(scene);
    }

    public getRequiredComponents(): ComponentClass[] {
        return [TransformComponent, PlayerComponent];
    }

    /**
     * Destroy a player by id: play explosion, cleanup sprite and entity.
     * Safe to call for both local and remote players.
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

    public update(): void {
        // Player visuals are event driven; nothing to update every frame for now.
    }
}
