import Phaser from 'phaser';

import { GameConfig } from '@shared/config';
import { CollisionLayer } from '@shared/types';
import { ProjectileDTO } from '@shared/dto/Projectile.dto';
import { ProjectileSchema } from '@shared/schema/Projectile.schema';

import { Entity } from '@/ecs/core/Entity';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { ColliderComponent } from '@/ecs/components/ColliderComponent';
import { GameScene } from '@/scenes/GameScene';
import { ProjectileDamageComponent } from '../components/ProjectileDamageComponent';


export class ProjectileEntityFactory {

    /**
     * Constructs a new ProjectileEntityFactory.
     * @param scene 
     */
    constructor(private scene: GameScene) {}

    public create(dto: ProjectileDTO): Entity {
        const result = ProjectileSchema.safeParse(dto);
        if (!result.success) {
            throw new Error('Invalid ProjectileDTO: ' + result.error.message);
        }

        const entity = this.scene.entityManager.createEntity();
        const sprite = this.scene.physics.add.sprite(dto.x, dto.y, 'projectile-1').setOrigin(0.5, 0.5);
        sprite.setCollideWorldBounds(false);
        sprite.setImmovable(true);
        sprite.setMaxVelocity(GameConfig.asteroid.maxVelocity);
        sprite.setData('id', dto.id);
        sprite.play('asteroid-spin');
        entity.addComponent(new TransformComponent(sprite));
        entity.addComponent(new ProjectileDamageComponent(dto.projectileType));
        entity.addComponent(new ColliderComponent(dto.collisionRadius, CollisionLayer.PROJECTILE));

        return entity;
    }
}
