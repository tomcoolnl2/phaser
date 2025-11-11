import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
    // Vite plugins
    plugins: [vue()],

    // Dependency optimization
    optimizeDeps: {
        include: ['phaser', 'socket.io-client'],
    },

    // Path resolution for aliases
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@shared': path.resolve(__dirname, './shared'),
        },
    },

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
        sourcemap: process.env.NODE_ENV !== 'production', // Only in dev/staging
        chunkSizeWarningLimit: 1500, // Phaser is ~1.47 MB, this is expected for game engines
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separate Phaser into its own chunk (cached separately)
                    phaser: ['phaser'],
                    // Separate Vue into its own chunk
                    vue: ['vue'],
                    // Separate Socket.IO into its own chunk
                    'socket.io': ['socket.io-client'],
                },
            },
        },
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
