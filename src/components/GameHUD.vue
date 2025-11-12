<template>
    <div class="game-hud">
        <div class="hud-container">
            <!-- Player Info Section -->
            <div class="hud-section player-info">
                <div class="hud-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />
                    </svg>
                </div>
                <div class="hud-content">
                    <div class="hud-label">Player</div>
                    <div class="hud-value">{{ playerName }}</div>
                </div>
            </div>

            <!-- Level Section -->
            <div class="hud-section level-info">
                <div class="hud-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                    </svg>
                </div>
                <div class="hud-content">
                    <div class="hud-label">Level</div>
                    <div class="hud-value level-value">
                        {{ level }}
                        <span class="level-max">/5</span>
                    </div>
                </div>
            </div>

            <!-- Ammo Section -->
            <div class="hud-section ammo-info">
                <div class="hud-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 15h2v2h-2v-2zm0-8h2v6h-2V9z" fill="currentColor" />
                    </svg>
                </div>
                <div class="hud-content">
                    <div class="hud-label">Ammo</div>
                    <div class="hud-value ammo-value" :class="{ 'low-ammo': ammo <= 3 }">
                        {{ ammo }}
                    </div>
                </div>
            </div>

            <!-- Score Section -->
            <div class="hud-section score-info">
                <div class="hud-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor" />
                    </svg>
                </div>
                <div class="hud-content">
                    <div class="hud-label">Score</div>
                    <div class="hud-value">{{ score }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Level } from '../../shared/model';

defineProps<{
    playerName: string;
    level: Level;
    ammo: number;
    score: number;
}>();
</script>

<style scoped>
.game-hud {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    pointer-events: none;
    padding: 20px;
}

.hud-container {
    display: flex;
    gap: 16px;
    justify-content: flex-start;
    align-items: flex-start;
    flex-wrap: wrap;
}

.hud-section {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(30, 30, 46, 0.85);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 12px;
    padding: 12px 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    pointer-events: auto;
}

.hud-section:hover {
    background: rgba(30, 30, 46, 0.95);
    border-color: rgba(99, 102, 241, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
}

.hud-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(99, 102, 241, 0.8);
    transition: color 0.3s ease;
}

.hud-section:hover .hud-icon {
    color: rgba(99, 102, 241, 1);
}

.hud-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.hud-label {
    font-size: 11px;
    font-weight: 600;
    color: rgba(199, 199, 209, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.hud-value {
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    text-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

.ammo-value {
    transition: color 0.3s ease;
}

.ammo-value.low-ammo {
    color: #ff6b6b;
    animation: pulse 1s ease-in-out infinite;
}

.level-value {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: #ffd700;
}

.level-max {
    font-size: 12px;
    color: rgba(199, 199, 209, 0.6);
    font-weight: 500;
}

.level-info .hud-icon {
    color: rgba(255, 215, 0, 0.8);
}

.level-info:hover .hud-icon {
    color: rgba(255, 215, 0, 1);
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.6;
    }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .game-hud {
        padding: 12px;
    }

    .hud-container {
        gap: 8px;
    }

    .hud-section {
        padding: 8px 12px;
    }

    .hud-icon svg {
        width: 20px;
        height: 20px;
    }

    .hud-value {
        font-size: 16px;
    }

    .hud-label {
        font-size: 10px;
    }
}
</style>
