#!/usr/bin/env node

/**
 * Comprehensive Zombie Spawning Debug Script
 * Tests zombie spawning system in isolation and with game integration
 */

const { Game } = require('./dist/server/src/game.js');
const { TeamMode } = require('./dist/common/src/constants.js');

console.log('🧟 Starting Zombie Spawning Debug Session...\n');

// Mock minimal game environment for testing
class DebugGame {
    constructor() {
        this.id = 999;
        this.teamMode = TeamMode.Solo;
        this.livingPlayers = new Set();
        this.connectedPlayers = new Set();
        this.spectatablePlayers = [];
        this.newPlayers = [];
        this.aliveCountDirty = false;
        this.updateObjects = false;
        this._zombieModeEnabled = false;
        this._started = true;

        // Mock grid
        this.grid = {
            addObject: (obj) => console.log(`✅ Grid: Added object ${obj.constructor.name}`),
            intersectsHitbox: () => [],
            pool: {
                getCategory: () => []
            }
        };

        // Mock map
        this.map = {
            width: 1024,
            height: 1024
        };

        // Mock gas system
        this.gas = {
            currentRadius: 400,
            currentPosition: { x: 512, y: 512 }
        };
    }

    log(...args) {
        console.log(`[DebugGame ${this.id}]`, ...args);
    }

    warn(...args) {
        console.warn(`[DebugGame ${this.id}] [WARNING]`, ...args);
    }

    addTimeout(callback, delay) {
        return setTimeout(callback, delay);
    }

    getHumanPlayerCount() {
        let count = 0;
        for (const player of this.livingPlayers) {
            if (!player.isZombie) count++;
        }
        return count;
    }
}

// Test 1: Basic Zombie Manager Initialization
console.log('🔍 Test 1: Zombie Manager Initialization');
try {
    const { ZombieManager } = require('./dist/server/src/zombies/zombieManager.js');
    const debugGame = new DebugGame();
    const zombieManager = new ZombieManager(debugGame);

    console.log('✅ ZombieManager created successfully');
    console.log(`   - Target zombie count: ${zombieManager.targetZombieCount.min}-${zombieManager.targetZombieCount.max}`);
    console.log(`   - Evolution level: ${zombieManager.evolutionLevel}`);
    console.log(`   - Spawn radius: ${zombieManager.spawnRadius.min}-${zombieManager.spawnRadius.max}`);
} catch (error) {
    console.log('❌ ZombieManager initialization failed:', error.message);
}

// Test 2: Solo Mode Detection
console.log('\n🔍 Test 2: Solo Mode Detection');
try {
    const debugGame = new DebugGame();
    console.log(`✅ TeamMode.Solo = ${TeamMode.Solo}`);
    console.log(`✅ Game teamMode = ${debugGame.teamMode}`);
    console.log(`✅ Is Solo Mode: ${debugGame.teamMode === TeamMode.Solo}`);
} catch (error) {
    console.log('❌ Solo mode detection failed:', error.message);
}

// Test 3: Zombie Spawning Logic
console.log('\n🔍 Test 3: Zombie Spawning Logic');
try {
    const { ZombieManager } = require('./dist/server/src/zombies/zombieManager.js');
    const { ZombiePlayer } = require('./dist/server/src/zombies/zombiePlayer.js');
    const debugGame = new DebugGame();
    const zombieManager = new ZombieManager(debugGame);

    // Mock a human player
    const mockPlayer = {
        isZombie: false,
        position: { x: 100, y: 100 },
        id: 1
    };
    debugGame.livingPlayers.add(mockPlayer);

    console.log(`✅ Added mock human player at (${mockPlayer.position.x}, ${mockPlayer.position.y})`);
    console.log(`✅ Human player count: ${debugGame.getHumanPlayerCount()}`);

    // Test zombie spawning
    debugGame._zombieModeEnabled = true;
    console.log('✅ Enabled zombie mode');

    console.log('🧟 Attempting to spawn zombies...');
    zombieManager.spawnZombiesForMatch(1);

    console.log(`✅ Zombies spawned: ${zombieManager.zombies.size}`);
    console.log(`✅ Living players total: ${debugGame.livingPlayers.size}`);

} catch (error) {
    console.log('❌ Zombie spawning test failed:', error.message);
    console.log('Stack trace:', error.stack);
}

// Test 4: Zombie Update Loop
console.log('\n🔍 Test 4: Zombie Update Loop');
try {
    const { ZombieManager } = require('./dist/server/src/zombies/zombieManager.js');
    const debugGame = new DebugGame();
    const zombieManager = new ZombieManager(debugGame);

    // Add mock human player
    const mockPlayer = {
        isZombie: false,
        position: { x: 100, y: 100 },
        id: 1
    };
    debugGame.livingPlayers.add(mockPlayer);
    debugGame._zombieModeEnabled = true;

    // Spawn zombies
    zombieManager.spawnZombiesForMatch(1);
    console.log(`✅ Initial zombie count: ${zombieManager.zombies.size}`);

    // Test update loop
    console.log('🔄 Running zombie update...');
    zombieManager.update();
    console.log('✅ Zombie update completed successfully');

} catch (error) {
    console.log('❌ Zombie update test failed:', error.message);
    console.log('Stack trace:', error.stack);
}

// Test 5: Performance Timing
console.log('\n🔍 Test 5: Performance Timing');
try {
    const { ZombieManager } = require('./dist/server/src/zombies/zombieManager.js');
    const debugGame = new DebugGame();
    const zombieManager = new ZombieManager(debugGame);

    // Add multiple mock players
    for (let i = 0; i < 5; i++) {
        debugGame.livingPlayers.add({
            isZombie: false,
            position: { x: 100 + i * 50, y: 100 + i * 50 },
            id: i + 1
        });
    }
    debugGame._zombieModeEnabled = true;

    // Spawn zombies and measure performance
    const startTime = Date.now();
    zombieManager.spawnZombiesForMatch(5);
    const spawnTime = Date.now() - startTime;

    console.log(`✅ Spawned ${zombieManager.zombies.size} zombies in ${spawnTime}ms`);

    // Test update performance
    const updateStartTime = Date.now();
    for (let i = 0; i < 10; i++) {
        zombieManager.update();
    }
    const updateTime = Date.now() - updateStartTime;

    console.log(`✅ 10 update cycles completed in ${updateTime}ms (${updateTime/10}ms per update)`);

} catch (error) {
    console.log('❌ Performance test failed:', error.message);
}

console.log('\n🎯 Debug Session Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Run this script: node server/debug-zombie-spawning.js');
console.log('2. Check for any error messages above');
console.log('3. If successful, test with actual game server');
console.log('4. Monitor server logs during solo game startup');