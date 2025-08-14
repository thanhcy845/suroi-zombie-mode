# 🧟 Zombie System Documentation

## Overview
The Zombie System is a comprehensive AI-driven survival mode that transforms Suroi into a zombie apocalypse survival game. This document provides detailed technical information about the zombie implementation.

## Architecture

### Core Components

#### 1. ZombieManager (`server/src/zombies/zombieManager.ts`)
- **Purpose**: Central management of all zombie-related operations
- **Responsibilities**:
  - Zombie spawning and despawning
  - Coordinating zombie behavior
  - Managing zombie lifecycle
  - Performance optimization

#### 2. ZombiePlayer (`server/src/zombies/zombiePlayer.ts`)
- **Purpose**: Individual zombie entity implementation
- **Responsibilities**:
  - Zombie movement and physics
  - Health and damage system
  - Player interaction
  - State management

#### 3. ZombieAI (`server/src/zombies/zombieAI.ts`)
- **Purpose**: Artificial intelligence and pathfinding
- **Responsibilities**:
  - A* pathfinding algorithm
  - Behavior state machine
  - Target selection and tracking
  - Obstacle avoidance

#### 4. ZombieTypes (`server/src/zombies/zombieTypes.ts`)
- **Purpose**: Zombie type definitions and configurations
- **Responsibilities**:
  - Zombie stats and properties
  - Type-specific behaviors
  - Spawn probability weights
  - Balance configurations

## Activation Logic

### Conditions for Zombie Mode
```typescript
// Zombie mode activates when:
if (this.teamMode === TeamMode.Solo && humanPlayerCount === 1) {
    this._zombieModeEnabled = true;
    this.zombieManager.spawnZombiesForMatch(humanPlayerCount);
}
```

### Timing
- **Grace Period**: 15 seconds after game start
- **Spawn Interval**: Configurable (default: every 30 seconds)
- **Max Zombies**: Scales with game duration

## Zombie AI Behavior

### State Machine
1. **SPAWNING**: Initial spawn state
2. **HUNTING**: Actively pursuing player
3. **WANDERING**: Random movement when no target
4. **ATTACKING**: Close-range combat with player
5. **DEAD**: Cleanup and removal

### Pathfinding Algorithm
```typescript
// A* pathfinding implementation
class ZombiePathfinder {
    findPath(start: Vector, target: Vector, obstacles: Obstacle[]): Vector[] {
        // A* algorithm with obstacle avoidance
        // Returns optimal path to target
    }
}
```

### Target Selection
- **Primary Target**: Nearest living human player
- **Fallback**: Random wandering if no players visible
- **Range**: Configurable detection radius

## Zombie Types

### Basic Zombie
- **Health**: 100 HP
- **Speed**: 0.8x player speed
- **Damage**: 25 per hit
- **Special**: None

### Fast Zombie
- **Health**: 60 HP
- **Speed**: 1.2x player speed
- **Damage**: 20 per hit
- **Special**: Quick attack animation

### Tank Zombie
- **Health**: 200 HP
- **Speed**: 0.5x player speed
- **Damage**: 40 per hit
- **Special**: Knockback resistance

### Swarm Zombie
- **Health**: 40 HP
- **Speed**: 0.9x player speed
- **Damage**: 15 per hit
- **Special**: Spawns in groups of 3-5

## Performance Optimization

### Zombie Limit Management
```typescript
const MAX_ZOMBIES = Math.min(20, playerCount * 5);
```

### AI Update Frequency
- **High Priority**: Zombies near players (60 FPS)
- **Medium Priority**: Zombies in view (30 FPS)
- **Low Priority**: Distant zombies (10 FPS)

### Memory Management
- Automatic cleanup of dead zombies
- Object pooling for frequent spawning
- Efficient collision detection

## Configuration

### Spawn Settings
```json
{
  "zombieSpawnDelay": 15000,
  "zombieSpawnInterval": 30000,
  "maxZombiesPerPlayer": 5,
  "zombieSpawnRadius": 100
}
```

### Difficulty Scaling
```typescript
const difficultyMultiplier = Math.min(2.0, 1.0 + (gameTime / 300000));
const zombieCount = baseZombieCount * difficultyMultiplier;
```

## Testing and Debugging

### Debug Commands
```bash
# Test zombie spawning
node server/zombie-system-test.js

# Test AI pathfinding
node server/test-zombie.js

# Run diagnostics
node server/zombie-diagnostics.js
```

### Debug Logging
```typescript
this.log(`[ZOMBIE] Spawning ${count} zombies for ${playerCount} players`);
this.log(`[ZOMBIE AI] Moving towards player at (${x}, ${y})`);
this.log(`[ZOMBIE] Player hit! Damage: ${damage}`);
```

### Performance Monitoring
- Zombie count tracking
- AI update frequency monitoring
- Memory usage analysis
- FPS impact measurement

## Integration Points

### Game Loop Integration
```typescript
// In game.ts update loop
if (this._zombieModeEnabled) {
    this.zombieManager.update(deltaTime);
}
```

### Player Interaction
```typescript
// Zombie-player collision detection
if (zombie.distanceTo(player) < ATTACK_RANGE) {
    player.damage(zombie.attackDamage);
}
```

### Network Synchronization
- Zombie positions sent to clients
- Zombie actions broadcasted
- Efficient delta compression

## Future Enhancements

### Planned Features
- **Boss Zombies**: Special zombie types with unique abilities
- **Zombie Evolution**: Zombies that grow stronger over time
- **Environmental Hazards**: Zombie-triggered map events
- **Cooperative Mode**: Multi-player zombie survival

### Performance Improvements
- **Spatial Partitioning**: Optimize collision detection
- **Behavior Trees**: More sophisticated AI
- **Predictive Pathfinding**: Anticipate player movement
- **Dynamic LOD**: Level-of-detail for distant zombies

## Troubleshooting

### Common Issues
1. **Zombies not spawning**: Check solo mode and player count
2. **Poor AI performance**: Verify pathfinding grid setup
3. **Sync issues**: Check network packet handling
4. **Memory leaks**: Monitor zombie cleanup

### Debug Steps
1. Enable debug logging
2. Check server console output
3. Monitor zombie count
4. Verify game state conditions
5. Test with single player

---

This documentation provides the technical foundation for understanding and extending the zombie system. For implementation details, refer to the source code in the `server/src/zombies/` directory.
