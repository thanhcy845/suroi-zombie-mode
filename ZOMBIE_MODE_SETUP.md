# Suroi Zombie Mode Enhancement - Setup Guide

This guide will help you set up and integrate the zombie mode enhancement into your Suroi game server.

## Overview

The zombie mode enhancement automatically spawns AI-controlled zombies in solo matches when there aren't enough players, creating an engaging PvE experience while maintaining the core battle royale mechanics.

## Features

- **Automatic Zombie Spawning**: Spawns 3 zombies per human player after 15-second wait period
- **3 Zombie Types**: Basic Zombie (tanky), Fast Runner (agile), Tank Zombie (high damage)
- **Evolution System**: Zombies get stronger every 3 minutes (3, 6, 9 minute marks)
- **Advanced AI**: Pathfinding, targeting, pack behavior, and tactical positioning
- **VSCode Extension**: Development tools with snippets and auto-completion

## Installation

### 1. Clone and Setup Suroi

```bash
git clone https://github.com/HasangerGames/suroi.git
cd suroi
pnpm install
```

### 2. Add Zombie System Files

Copy the zombie system files to your Suroi installation:

```
suroi/
├── server/src/zombies/
│   ├── zombiePlayer.ts
│   ├── zombieAI.ts
│   ├── zombieManager.ts
│   └── zombieTypes.ts
└── common/src/definitions/
    └── zombieTypes.ts (if needed for client)
```

### 3. Install VSCode Extension

```bash
cd suroi-zombie-extension
npm install
npm run compile
```

Then install the extension in VSCode:
1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X)
3. Click "..." menu → "Install from VSIX"
4. Select the compiled extension file

## Configuration

### Game Settings

The zombie system can be configured in `server/src/zombies/zombieTypes.ts`:

```typescript
// Adjust spawn ratios
const ZOMBIE_SPAWN_RATIO = 3; // zombies per human player

// Evolution timing (milliseconds)
const EVOLUTION_INTERVALS = [
    3 * 60 * 1000,  // 3 minutes
    6 * 60 * 1000,  // 6 minutes  
    9 * 60 * 1000   // 9 minutes
];

// Zombie stats
export const ZombieTypes = {
    basic_zombie: {
        health: 120,
        speed: 0.8,
        damage: 25,
        // ... other properties
    }
    // ... other zombie types
};
```

### Server Configuration

In `server/src/utils/config.ts`, you can adjust:

```typescript
// Minimum players to start game (affects zombie spawning)
minTeamsToStart: 1, // Set to 1 to allow solo zombie mode

// Game spawn window (time before preventing new joins)
gameSpawnWindow: 84, // seconds
```

## Testing

### 1. Start Development Server

```bash
# Terminal 1 - Start server
cd suroi
pnpm dev:server

# Terminal 2 - Start client  
pnpm dev:client
```

### 2. Test Zombie Mode

1. Open browser to `http://127.0.0.1:3000`
2. Click "Play Solo"
3. Wait 15 seconds without other players joining
4. Zombies should automatically spawn
5. Test zombie behavior, evolution, and combat

### 3. Debug Mode

Enable debug logging in the zombie system:

```typescript
// In zombieManager.ts
private debugMode = true; // Enable detailed logging

// In zombieAI.ts  
private logAIState(): void {
    if (this.debugMode) {
        console.log(`Zombie ${this.zombie.id}: ${this._currentState}`);
    }
}
```

## Development Workflow

### Using VSCode Extension

1. **Create New Zombie Type**:
   - `Ctrl+Shift+P` → "Create Zombie Type Definition"
   - Fill in the prompted values

2. **Create Custom Zombie Class**:
   - `Ctrl+Shift+P` → "Create Zombie Class"
   - Implement custom behavior

3. **Add AI Behavior**:
   - `Ctrl+Shift+P` → "Create AI Behavior"
   - Define state handling logic

### Code Snippets

Use these snippets in TypeScript files:

- `zombie-player` - Create zombie player class
- `zombie-type` - Create zombie type definition
- `ai-behavior` - Create AI behavior state
- `zombie-imports` - Add zombie imports

### File Structure

```
server/src/zombies/
├── zombiePlayer.ts      # Base zombie player class
├── zombieAI.ts          # AI behavior system
├── zombieManager.ts     # Spawning and management
├── zombieTypes.ts       # Type definitions
└── custom/              # Your custom zombie implementations
    ├── explosiveZombie.ts
    ├── stealthZombie.ts
    └── bossZombie.ts
```

## Customization

### Creating Custom Zombie Types

1. Add new type definition in `zombieTypes.ts`:

```typescript
{
    idString: "stealth_zombie",
    name: "Stealth Zombie", 
    health: 90,
    speed: 1.1,
    damage: 30,
    attackRange: 2,
    detectionRange: 25, // Higher detection
    skin: "ghillie_suit",
    evolutionLevel: 0,
    aggressionLevel: 0.9,
    packBehavior: false
}
```

2. Create custom zombie class:

```typescript
export class StealthZombie extends ZombiePlayer {
    private stealthMode = false;
    
    constructor(game: Game, position: Vector) {
        super(game, ZombieTypes.fromString("stealth_zombie"), position);
    }
    
    override update(): void {
        if (this.dead) return;
        
        // Custom stealth behavior
        this.updateStealthMode();
        
        super.update();
    }
    
    private updateStealthMode(): void {
        // Become invisible when not moving
        const isMoving = this.movement.up || this.movement.down || 
                        this.movement.left || this.movement.right;
        this.stealthMode = !isMoving;
    }
}
```

### Modifying AI Behavior

Customize AI in `zombieAI.ts`:

```typescript
// Add new AI state
export enum ZombieAIState {
    // ... existing states
    Stalking,  // New stealth state
    Ambushing  // New ambush state
}

// Add state handler
private handleStalkingState(): void {
    const nearestPlayer = this.findNearestPlayer();
    
    if (nearestPlayer && this.isInAttackRange(nearestPlayer)) {
        this.setState(ZombieAIState.Ambushing, nearestPlayer);
    }
}
```

## Troubleshooting

### Common Issues

1. **Zombies Not Spawning**:
   - Check that game is in solo mode (`TeamMode.Solo`)
   - Verify 15-second timer is completing
   - Check console for error messages

2. **AI Not Working**:
   - Ensure `zombieAI.update()` is being called
   - Check pathfinding grid initialization
   - Verify target detection logic

3. **Performance Issues**:
   - Reduce zombie count in `zombieManager.ts`
   - Increase AI update intervals
   - Optimize pathfinding frequency

### Debug Commands

Add these to your development console:

```typescript
// Spawn test zombie
game.zombieManager.spawnZombie();

// Force evolution
game.zombieManager.evolveAllZombies();

// Get zombie stats
console.log(game.zombieManager.getStats());
```

## Performance Optimization

### Recommended Settings

For optimal performance with zombies:

```typescript
// In zombieAI.ts
const ZombieAIConstants = {
    pathfindingUpdateInterval: 1000, // Increase for better performance
    targetSwitchCooldown: 3000,      // Reduce target switching
    // ... other constants
};

// In zombieManager.ts  
private spawnRatio = 2; // Reduce from 3 to 2 zombies per player
```

### Monitoring

Monitor server performance:

```bash
# Check memory usage
node --inspect server/dist/server.js

# Monitor tick rate
# Add logging in game.ts tick() method
```

## Next Steps

1. **Balance Testing**: Adjust zombie stats based on gameplay feedback
2. **Custom Zombies**: Create specialized zombie types for different maps
3. **Boss Zombies**: Implement rare, powerful zombie variants
4. **Zombie Events**: Add special zombie spawn events
5. **Client Integration**: Add zombie-specific UI elements and sounds

For support and contributions, see the main Suroi repository and Discord community.
