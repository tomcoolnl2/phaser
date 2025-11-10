<template>
    <div id="app">
        <!-- Player Name Modal -->
        <PlayerNameModal
            :is-visible="showNameModal"
            @submit="handleNameSubmit"
        />

        <!-- Game HUD -->
        <GameHUD
            v-if="gameStarted && playerData"
            :player-name="playerData.name"
            :ammo="playerData.ammo"
            :score="playerData.score"
        />

        <!-- Phaser game canvas will be injected here by Phaser -->
        <div id="phaser-game"></div>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue'
    import PlayerNameModal from './components/PlayerNameModal.vue'
    import GameHUD from './components/GameHUD.vue'

    const showNameModal = ref(true)
    const gameStarted = ref(false)
    const playerData = ref<{name: string; ammo: number; score: number } | null>(null)

    const handleNameSubmit = (name: string) => {
        showNameModal.value = false
        gameStarted.value = true
        playerData.value = {
            name,
            ammo: 10,
            score: 0,
        }
        
        // Emit custom event that the game can listen to
        window.dispatchEvent(new CustomEvent('playerNameSubmitted', { detail: { name } }))
    }

    // Listen for game updates from Phaser
    onMounted(() => {
        window.addEventListener('updatePlayerData', ((event: CustomEvent) => {
            if (playerData.value) {
                playerData.value = {
                    ...playerData.value,
                    ...event.detail,
                }
            }
        }) as EventListener)
    })
</script>

<style scoped>
#app {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

#phaser-game {
  width: 100%;
  height: 100%;
}
</style>
