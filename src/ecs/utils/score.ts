import { Entity } from '@/ecs/core/Entity';
import { ScoreComponent } from '@/ecs/components/ScoreComponent';

/**
 * Utility to add points to a player's score.
 */
export function addScore(entity: Entity, points: number) {
    const score = entity.getComponent(ScoreComponent);
    if (score) {
        score.add(points);
    }
}
