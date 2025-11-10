<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="handleOverlayClick">
    <div class="modal-container">
      <div class="modal-header">
        <h2>Welcome to Space Shooter!</h2>
      </div>
      <div class="modal-body">
        <p>Enter your name to join the game:</p>
        <input
          ref="nameInput"
          v-model="playerName"
          type="text"
          placeholder="Your name"
          maxlength="20"
          @keyup.enter="handleSubmit"
          class="name-input"
        />
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>
      <div class="modal-footer">
        <button @click="handleSubmit" class="btn-primary" :disabled="!playerName.trim()">
          Join Game
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  isVisible: boolean
}>()

const emit = defineEmits<{
  submit: [name: string]
}>()

const playerName = ref('')
const errorMessage = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

// Focus input when modal becomes visible
watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      nextTick(() => {
        nameInput.value?.focus()
      })
    }
  }
)

const handleSubmit = () => {
  const name = playerName.value.trim()
  if (!name) {
    errorMessage.value = 'Please enter a name'
    return
  }
  if (name.length < 2) {
    errorMessage.value = 'Name must be at least 2 characters'
    return
  }
  errorMessage.value = ''
  emit('submit', name)
}

const handleOverlayClick = () => {
  // Don't allow closing by clicking overlay - must enter a name
  errorMessage.value = 'Please enter your name to continue'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(99, 102, 241, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  margin-bottom: 24px;
  text-align: center;
}

.modal-header h2 {
  color: #ffffff;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
}

.modal-body {
  margin-bottom: 24px;
}

.modal-body p {
  color: #c7c7d1;
  font-size: 16px;
  margin-bottom: 16px;
  text-align: center;
}

.name-input {
  width: 100%;
  padding: 14px 20px;
  font-size: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  color: #ffffff;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.name-input:focus {
  border-color: rgba(99, 102, 241, 0.8);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
}

.name-input::placeholder {
  color: rgba(199, 199, 209, 0.5);
}

.error-message {
  color: #ff6b6b;
  font-size: 14px;
  margin-top: 12px;
  text-align: center;
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-8px);
  }
  75% {
    transform: translateX(8px);
  }
}

.modal-footer {
  text-align: center;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  padding: 14px 40px;
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
