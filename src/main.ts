import { createApp } from 'vue';
import App from './App.vue';
import { Game } from './game/Game';
import { EventBus } from './listeners/EventBus';

// Create Vue app
const app = createApp(App);
app.mount('#app');

// Initialize game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    EventBus.initialize();
    new Game();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Tab is hidden (user switched tab or minimized window)');
    } else {
        console.log('Tab is visible (user switched back)');
    }
});

window.addEventListener('blur', () => {
    console.log('Window lost focus (user switched to another program)');
});

window.addEventListener('focus', () => {
    console.log('Window gained focus (user came back)');
});
