

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RenderSystem } from '@/ecs/systems/RenderSystem';
import { Entity } from '@/ecs/core/Entity';
import { TransformComponent } from '@/ecs/components/TransformComponent';
import { UIComponent } from '@/ecs/components/UIComponent';
import { WeaponComponent } from '@/ecs/components/WeaponComponent';
import { PlayerComponent } from '@/ecs/components/PlayerComponent';

// Minimal mock for Phaser sprite
function createMockSprite(x: number, y: number) {
    return { x, y } as unknown as Phaser.Physics.Arcade.Sprite;
}

// Minimal mock for Phaser text
function createMockText(text: string) {
    return {
        text,
        setText: vi.fn(function (this: any, t: string) { this.text = t; return this; }),
        setPosition: vi.fn(function (this: any, x: number, y: number) { this.x = x; this.y = y; return this; }),
        setOrigin: vi.fn(function () { return this; }),
        setScrollFactor: vi.fn(function () { return this; }),
        destroy: vi.fn(),
        x: 0,
        y: 0,
    } as unknown as Phaser.GameObjects.Text;
}


// Helper to create a real UIComponent with spies
function createRealUIComponent(isLocal = false) {
    const scene = {
        add: {
        text: vi.fn((x: number, y: number, text: string) => createMockText(text)),
        },
    } as unknown as Phaser.Scene;
    const ui = new UIComponent(scene, 'Name', 1, isLocal, 0, 0);
    ui.levelText = createMockText('Level: 1');
    ui.nameText = createMockText('Name');
    ui.updatePosition = vi.fn(ui.updatePosition.bind(ui));
    ui.updateAmmo = vi.fn(ui.updateAmmo.bind(ui));
    ui.updateLevel = vi.fn(ui.updateLevel.bind(ui));
    return ui;
}

function createRealTransformComponent(x: number, y: number) {
    const sprite = createMockSprite(x, y);
    return new TransformComponent(sprite);
}

function createRealWeaponComponent() {
    const dto = { ammo: 5, fireRate: 0, damage: 0 } as any;
    const weapon = new WeaponComponent({} as any, dto, '');
    vi.spyOn(weapon, 'getAmmo').mockReturnValue(5);
    return weapon;
}

function createRealPlayerComponent(level: number) {
    return new PlayerComponent('id', 'name', false, level as any);
}

describe('RenderSystem', () => {
    let renderSystem: RenderSystem;
    let scene: any;
    let entity: Entity;
    let transform: TransformComponent;
    let ui: UIComponent;

    beforeEach(() => {
        scene = {};
        renderSystem = new RenderSystem(scene);
        entity = new Entity('test');
        transform = createRealTransformComponent(10, 20);
        ui = createRealUIComponent();
        entity.addComponent(transform);
        entity.addComponent(ui);
    });

    it('should update UI position to follow sprite', () => {
        renderSystem.update(entity, 0);
        expect(ui.updatePosition).toHaveBeenCalledWith(10, 20);
    });

    it('should update ammo if local and has weapon', () => {
        ui.isLocal = true;
        const weapon = createRealWeaponComponent();
        entity.addComponent(weapon);
        renderSystem.update(entity, 0);
        expect(ui.updateAmmo).toHaveBeenCalledWith(5);
    });

    it('should update level if player level changed', () => {
        const player = createRealPlayerComponent(2);
        entity.addComponent(player);
        ui.levelText.text = 'Level: 1';
        renderSystem.update(entity, 0);
        expect(ui.updateLevel).toHaveBeenCalledWith(2);
    });

    it('should not update level if player level unchanged', () => {
        const player = createRealPlayerComponent(1);
        entity.addComponent(player);
        ui.levelText.text = 'Level: 1';
        renderSystem.update(entity, 0);
        expect(ui.updateLevel).not.toHaveBeenCalled();
    });
});
