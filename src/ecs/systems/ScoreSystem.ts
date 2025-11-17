import { System } from '@/ecs/core/System';
import { Entity } from '@/ecs/core/Entity';
import { ComponentClass } from '@/ecs/core/Component';
import { ScoreComponent } from '@/ecs/components/ScoreComponent';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';
import { GameScene } from '@/scenes/GameScene';

/**
 * ScoreSystem: Handles score display and updates for all players.
 * - Updates HUD/UI when score changes (for local player)
 * - Can be extended for score-based events/logic
 */
export class ScoreSystem extends System {
    constructor(protected scene: GameScene) {
        super(scene);
    }

    public getRequiredComponents(): ComponentClass[] {
        return [ScoreComponent, PlayerComponent];
    }

    public update(entity: Entity, _delta: number): void {
        // For now, just update HUD for local player
        const player = entity.getComponent(PlayerComponent);
        const score = entity.getComponent(ScoreComponent);
        if (player && score && player.isLocal) {
            window.dispatchEvent(
                new CustomEvent('updatePlayerScore', { detail: { score: score.score } })
            );
        }
    }
}
