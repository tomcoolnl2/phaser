import { describe, it, beforeEach, expect, vi } from 'vitest';
import { PlayerPickupListener } from '@/listeners/player/pickup.listener';
import { Socket } from 'socket.io-client';
import { GameScene } from '@/scenes/GameScene';
import { PickupDTO } from '@shared/dto/Pickup.dto';
import { SocketResponseDTOSuccess } from '@shared/dto/SocketResponse.dto';
import { EventBus } from '@/listeners/EventBus';

EventBus.initialize();

class MockSocket {
    on = vi.fn();
}

class MockGameScene {
    destroyPickupEntity = vi.fn();
}

describe('PlayerPickupListener', () => {
    let mockSocket: MockSocket;
    let mockScene: MockGameScene;

    beforeEach(() => {
        mockSocket = new MockSocket();
        mockScene = new MockGameScene();
    });

    it('should call destroyPickupEntity with the correct id', () => {
        const pickupDTO: PickupDTO = { id: 'pickup1' } as PickupDTO;
        const listener = new PlayerPickupListener(mockSocket as unknown as Socket, mockScene as unknown as GameScene);
        // @ts-expect-error: handle is protected
        listener.handle({ dto: pickupDTO } as SocketResponseDTOSuccess<PickupDTO>);
        expect(mockScene.destroyPickupEntity).toHaveBeenCalledWith('pickup1');
    });
});
