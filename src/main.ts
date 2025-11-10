import { createApp } from 'vue';
import App from './App.vue';
import { Game } from './game/Game';

// Create Vue app
const app = createApp(App);
app.mount('#app');

// Initialize game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
