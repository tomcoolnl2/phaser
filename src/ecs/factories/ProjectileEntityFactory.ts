import { ProjectileDTO } from '@shared/dto/Projectile.dto';
import { Entity } from '@/ecs/core/Entity';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { ProjectileComponent } from '@/ecs/components/ProjectileComponent';
import { GameScene } from '@/scenes/GameScene';


export class ProjectileEntityFactory {

    /**
     * Constructs a new ProjectileEntityFactory.
     * @param scene 
     */
    constructor(private scene: GameScene) {}

    public create(dto: ProjectileDTO): Entity {
        
        const entity = this.scene.entityManager.createEntity();
        const sprite = this.scene.physics.add.sprite(dto.x, dto.y, dto.spriteKey).setOrigin(0.5, 0.5);
        
        sprite.setCollideWorldBounds(false);
        sprite.setImmovable(true);
        sprite.setData('id', dto.id);
        sprite.rotation = Math.atan2(dto.dy, dto.dx) + Math.PI / 2;
        
        entity.addComponent(new TransformComponent(sprite));
        entity.addComponent(new ProjectileComponent(dto.id));

        return entity;
    }
}
