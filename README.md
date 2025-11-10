# Multiplayer Space Shooter 🚀

A real-time multiplayer space shooter built with Phaser 3, TypeScript, Socket.io, and Vite.

## Project Structure

```
├── src/                    # Client-side code
│   ├── main.ts            # Entry point
│   ├── game/              # Game initialization
│   ├── scenes/            # Phaser scenes
│   ├── entities/          # Game entities (Player, Asteroid, Pickup)
│   └── types/             # TypeScript types (symlinked to shared/)
├── server/                # Server-side code
│   └── index.ts           # Socket.io game server
├── shared/                # Shared types between client & server
│   ├── models.ts          # Data models
│   └── events.ts          # Socket.io event definitions
├── public/                # Static assets
│   └── assets/            # Game sprites, images, sounds
└── src.old/               # Backup of original code
```

## Tech Stack

-   **Phaser 3.87.0** - Game engine
-   **TypeScript 5.6** - Type-safe JavaScript
-   **Vite 5.4** - Lightning-fast build tool
-   **Socket.io 4.8** - Real-time multiplayer
-   **Express 4.21** - Web server
-   **ESLint + Prettier** - Code quality

## Getting Started

### Prerequisites

-   Node.js v22+ (use nvm: `nvm use`)
-   npm

### Installation

```bash
npm install
```

### Development

Run the game server and client separately:

```bash
# Terminal 1: Start the game server (port 3000)
npm run server:watch

# Terminal 2: Start the Vite dev server (port 5173)
npm run dev
```

Then open http://localhost:5173 in your browser.

## Available Scripts

-   `npm run dev` - Start Vite dev server (client)
-   `npm run build` - Build for production
-   `npm run preview` - Preview production build
-   `npm run server` - Start game server once
-   `npm run server:watch` - Start game server with auto-reload
-   `npm run lint` - Run ESLint
-   `npm run lint:fix` - Fix ESLint errors
-   `npm run format` - Format code with Prettier

## Game Controls

-   **Arrow Keys** - Move ship
-   **Space** - Fire weapon (when you have ammo)

## How It Works

1. **Server** (port 3000): Manages game state, spawns asteroids and pickups
2. **Client** (port 5173): Renders game, handles input, syncs with server via Socket.io
3. **Real-time sync**: Player positions, shooting, collisions

## Assets

Game assets are located in `public/assets/`:

-   Ships (player & enemy)
-   Asteroids
-   Bullets & explosions
-   Pickups & particle effects

## Architecture Highlights

### Modern Phaser 3 Patterns

-   Scene-based architecture (BootScene → GameScene)
-   Entity component system
-   Physics-driven gameplay

### Multiplayer Features

-   Real-time player synchronization
-   Server-authoritative game logic
-   Collision detection & damage
-   Pickup/ammo system

### Clean Code

-   Strict TypeScript configuration
-   Shared types between client/server
-   Modular entity classes
-   ESLint + Prettier enforcement

## Migration Notes

This project was migrated from:

-   Phaser CE → Phaser 3
-   Webpack → Vite
-   TSLint → ESLint
-   Old Socket.io → Socket.io v4

Original code preserved in `src.old/` for reference.

## License

MIT
