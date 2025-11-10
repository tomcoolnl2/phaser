import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],

    // Development server config
    server: {
        port: 5173,
        open: true,
        // Proxy socket.io to game server
        proxy: {
            '/socket.io': {
                target: 'http://localhost:3000',
                ws: true,
            },
        },
    },

    // Build configuration
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser'],
                },
            },
        },
    },

    // Optimize dependencies
    optimizeDeps: {
        include: ['phaser', 'socket.io-client'],
    },

    // Define global constants for Phaser
    define: {
        CANVAS_RENDERER: JSON.stringify(true),
        WEBGL_RENDERER: JSON.stringify(true),
        WEBGL_DEBUG: JSON.stringify(false),
        EXPERIMENTAL: JSON.stringify(false),
        PLUGIN_3D: JSON.stringify(false),
        PLUGIN_CAMERA3D: JSON.stringify(false),
        PLUGIN_FBINSTANT: JSON.stringify(false),
        FEATURE_SOUND: JSON.stringify(true),
    },
});
