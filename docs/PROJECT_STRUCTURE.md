# 📁 Project Structure

This document provides an overview of the Suroi Zombie Mode project structure and organization.

## 🏗️ Root Directory

```
suroi-zombie-mode/
├── 📁 client/                 # Game client (browser-based)
├── 📁 server/                 # Game server (Node.js)
├── 📁 common/                 # Shared code between client and server
├── 📁 docs/                   # Project documentation
├── 📁 node_modules/           # Dependencies (auto-generated)
├── 📄 .gitignore             # Git ignore rules
├── 📄 CONTRIBUTING.md        # Contribution guidelines
├── 📄 README.md              # Main project documentation
├── 📄 package.json           # Project configuration and scripts
├── 📄 pnpm-lock.yaml         # Dependency lock file
├── 📄 config.json            # Server configuration
└── 📄 tsconfig.json          # TypeScript configuration
```

## 🖥️ Server Structure

```
server/
├── 📁 src/                    # Source code
│   ├── 📁 zombies/           # 🧟 Zombie system implementation
│   │   ├── 📄 zombieManager.ts      # Central zombie management
│   │   ├── 📄 zombiePlayer.ts       # Individual zombie entities
│   │   ├── 📄 zombieAI.ts           # AI and pathfinding logic
│   │   ├── 📄 zombieTypes.ts        # Zombie type definitions
│   │   └── 📄 zombieTests.ts        # Zombie system tests
│   ├── 📁 objects/           # Game objects
│   │   ├── 📄 player.ts             # Player entity logic
│   │   ├── 📄 gameObject.ts         # Base game object class
│   │   ├── 📄 bullet.ts             # Bullet physics and logic
│   │   └── 📄 ...                   # Other game objects
│   ├── 📁 utils/             # Utility functions
│   │   ├── 📄 config.ts             # Configuration management
│   │   ├── 📄 serverHelpers.ts      # Server utility functions
│   │   └── 📄 ...                   # Other utilities
│   ├── 📄 game.ts            # Core game logic with zombie integration
│   ├── 📄 gameManager.ts     # Game instance management
│   ├── 📄 server.ts          # Server entry point
│   └── 📄 map.ts             # Map generation and management
├── 📁 dist/                  # Compiled JavaScript (auto-generated)
├── 📄 config.json           # Server configuration
├── 📄 config.example.json   # Example configuration
├── 📄 zombie-diagnostics.js # Zombie system diagnostics
├── 📄 zombie-system-test.js # Zombie system testing
└── 📄 test-zombie.js        # Individual zombie testing
```

## 🌐 Client Structure

```
client/
├── 📁 src/                   # Source code
│   ├── 📁 scripts/          # TypeScript/JavaScript code
│   │   ├── 📁 game/         # Core game logic
│   │   ├── 📁 ui/           # User interface components
│   │   ├── 📁 utils/        # Utility functions
│   │   └── 📄 main.ts       # Client entry point
│   ├── 📁 scss/             # Stylesheets (SASS/CSS)
│   ├── 📁 translations/     # Internationalization files
│   └── 📁 templates/        # HTML templates
├── 📁 public/               # Static assets
│   ├── 📁 img/             # Images and sprites
│   ├── 📁 audio/           # Sound effects and music
│   └── 📁 fonts/           # Font files
├── 📁 dist/                # Built client files (auto-generated)
└── 📄 vite.config.ts       # Vite build configuration
```

## 🔗 Common Structure

```
common/
├── 📁 src/                  # Shared source code
│   ├── 📁 constants/       # Game constants and enums
│   ├── 📁 definitions/     # Game object definitions
│   ├── 📁 packets/         # Network packet definitions
│   ├── 📁 utils/           # Shared utility functions
│   └── 📄 ...              # Other shared modules
└── 📁 dist/                # Compiled shared code (auto-generated)
```

## 📚 Documentation Structure

```
docs/
├── 📄 SETUP_GUIDE.md       # Installation and setup instructions
├── 📄 ZOMBIE_SYSTEM.md     # Detailed zombie system documentation
├── 📄 PROJECT_STRUCTURE.md # This file - project organization
├── 📄 API_REFERENCE.md     # API documentation (if applicable)
└── 📄 CHANGELOG.md         # Version history and changes
```

## 🧟 Zombie System Files

### Core Zombie Files
| File | Purpose | Key Functions |
|------|---------|---------------|
| `zombieManager.ts` | Central zombie management | `spawnZombiesForMatch()`, `updateZombies()`, `cleanupZombies()` |
| `zombiePlayer.ts` | Individual zombie logic | `update()`, `moveTowards()`, `attackPlayer()` |
| `zombieAI.ts` | AI and pathfinding | `findPath()`, `updateBehavior()`, `selectTarget()` |
| `zombieTypes.ts` | Type definitions | `ZombieType`, `ZombieStats`, `createZombie()` |

### Integration Points
| File | Integration | Description |
|------|-------------|-------------|
| `game.ts` | Main game loop | Zombie system integration with game updates |
| `player.ts` | Player interaction | Zombie-player collision and damage |
| `server.ts` | Server startup | Zombie system initialization |

## 🔧 Configuration Files

### Server Configuration
- **`config.json`**: Main server configuration
- **`config.example.json`**: Template configuration file
- **`tsconfig.json`**: TypeScript compiler settings

### Build Configuration
- **`package.json`**: Project metadata and scripts
- **`vite.config.ts`**: Client build configuration
- **`pnpm-lock.yaml`**: Dependency lock file

## 🚀 Build Output

### Server Build
```
server/dist/
├── 📁 server/
│   └── 📁 src/
│       ├── 📁 zombies/      # Compiled zombie system
│       ├── 📄 game.js       # Compiled game logic
│       ├── 📄 server.js     # Compiled server entry
│       └── 📄 ...           # Other compiled files
└── 📄 *.js.map             # Source maps for debugging
```

### Client Build
```
client/dist/
├── 📄 index.html           # Main HTML file
├── 📁 scripts/             # Compiled JavaScript
├── 📁 styles/              # Compiled CSS
├── 📁 img/                 # Optimized images
├── 📁 audio/               # Optimized audio
└── 📁 fonts/               # Font files
```

## 📦 Package Scripts

### Development Scripts
```json
{
  "dev": "Start both server and client in development mode",
  "dev:server": "Start server with auto-reload",
  "dev:client": "Start client with hot reload"
}
```

### Build Scripts
```json
{
  "build": "Build both server and client",
  "build:server": "Compile server TypeScript",
  "build:client": "Build client for production"
}
```

### Test Scripts
```json
{
  "test": "Run all tests",
  "test:zombie": "Run zombie system tests",
  "test:server": "Run server tests"
}
```

## 🔍 Key Directories Explained

### `/server/src/zombies/`
**Purpose**: Contains all zombie-related server logic
**Key Features**:
- Zombie spawning and management
- AI pathfinding algorithms
- Zombie type definitions
- Performance optimization

### `/client/src/scripts/game/`
**Purpose**: Client-side game logic
**Key Features**:
- Game rendering and graphics
- User input handling
- Network communication
- UI management

### `/common/src/`
**Purpose**: Shared code between client and server
**Key Features**:
- Game constants and definitions
- Network packet structures
- Utility functions
- Type definitions

## 🛠️ Development Workflow

### File Modification Flow
1. **Edit Source**: Modify files in `src/` directories
2. **Build**: Run `pnpm build` or use dev mode
3. **Test**: Execute relevant test scripts
4. **Debug**: Use source maps and logging

### Adding New Features
1. **Server Logic**: Add to `server/src/`
2. **Client Logic**: Add to `client/src/`
3. **Shared Code**: Add to `common/src/`
4. **Documentation**: Update relevant docs
5. **Tests**: Add test files

## 📋 File Naming Conventions

### TypeScript Files
- **Classes**: PascalCase (`ZombieManager.ts`)
- **Utilities**: camelCase (`serverHelpers.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts`

### Asset Files
- **Images**: lowercase with hyphens (`zombie-sprite.png`)
- **Audio**: lowercase with hyphens (`zombie-growl.mp3`)
- **Configs**: lowercase (`config.json`)

## 🔗 Dependencies

### Server Dependencies
- **uWebSockets.js**: High-performance WebSocket server
- **TypeScript**: Type-safe JavaScript development
- **Node.js**: Server runtime environment

### Client Dependencies
- **Vite**: Fast build tool and dev server
- **PIXI.js**: 2D graphics rendering
- **TypeScript**: Type-safe development

### Shared Dependencies
- **pnpm**: Package manager
- **ESLint**: Code linting
- **Prettier**: Code formatting

---

This structure provides a solid foundation for understanding and navigating the Suroi Zombie Mode codebase. Each directory and file has a specific purpose in creating the zombie survival experience.
