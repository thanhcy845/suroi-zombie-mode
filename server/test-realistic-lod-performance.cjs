#!/usr/bin/env node

/**
 * Realistic LOD System Performance Test
 * Tests actual LOD performance with real players and proper timing
 */

const { performance } = require("perf_hooks");

console.log("🧪 Starting Realistic LOD Performance Test Suite...\n");

async function createRealisticPerformanceTest() {
    try {
        // Import required modules
        const { Game } = require("./dist/server/src/game.js");
        const { TeamMode } = require("./dist/common/src/constants.js");
        const { ZombieManager } = require("./dist/server/src/zombies/zombieManager.js");
        const { Player } = require("./dist/server/src/objects/player.js");
        const { Vec } = require("./dist/common/src/utils/vector.js");

        console.log("✅ Successfully imported all modules");

        // Test configuration
        const CONFIG = {
            zombieCount: 25,
            humanPlayerCount: 4,
            testDurationSeconds: 5,
            ticksPerSecond: 60,
            mapSize: 100,
            warmupTicks: 60 // 1 second warmup
        };

        console.log(`📊 Test Configuration:
- Zombies: ${CONFIG.zombieCount}
- Human Players: ${CONFIG.humanPlayerCount}
- Duration: ${CONFIG.testDurationSeconds}s
- Tick Rate: ${CONFIG.ticksPerSecond} Hz
- Map Size: ${CONFIG.mapSize}x${CONFIG.mapSize}
`);

        // Create game instance
        const game = new Game(995, TeamMode.Solo, "normal");
        const zombieManager = new ZombieManager(game);

        // Create realistic human players at various positions
        const humanPlayers = [];
        for (let i = 0; i < CONFIG.humanPlayerCount; i++) {
            const player = new Player(game, null, Vec(
                Math.random() * CONFIG.mapSize,
                Math.random() * CONFIG.mapSize
            ));
            player.isZombie = false;
            game.livingPlayers.add(player);
            game.connectedPlayers.add(player);
            humanPlayers.push(player);
        }

        console.log(`👥 Created ${humanPlayers.length} human players`);

        // Spawn zombies at mixed distances to trigger varied LOD levels
        const zombiePositions = [
            // Close zombies (high LOD)
            ...Array(8).fill().map(() => Vec(
                humanPlayers[0].position.x + (Math.random() - 0.5) * 30,
                humanPlayers[0].position.y + (Math.random() - 0.5) * 30
            )),
            // Medium distance zombies (medium LOD)
            ...Array(8).fill().map(() => Vec(
                humanPlayers[0].position.x + (Math.random() - 0.5) * 60,
                humanPlayers[0].position.y + (Math.random() - 0.5) * 60
            )),
            // Far zombies (low/minimal LOD)
            ...Array(9).fill().map(() => Vec(
                Math.random() * CONFIG.mapSize,
                Math.random() * CONFIG.mapSize
            ))
        ];

        for (let i = 0; i < CONFIG.zombieCount; i++) {
            zombieManager.spawnZombie(zombiePositions[i] || Vec(
                Math.random() * CONFIG.mapSize,
                Math.random() * CONFIG.mapSize
            ));
        }

        console.log(`🧟 Spawned ${zombieManager.zombies.size} zombies at mixed distances`);

        // Warmup phase
        console.log("🔥 Warming up system...");
        for (let i = 0; i < CONFIG.warmupTicks; i++) {
            zombieManager.update();
        }

        // Performance measurement phase
        console.log("⏱️  Starting performance measurement...");

        const totalTicks = CONFIG.testDurationSeconds * CONFIG.ticksPerSecond;
        const tickTimes = [];
        const lodDistributions = [];

        const startTime = performance.now();

        for (let tick = 0; tick < totalTicks; tick++) {
            const tickStart = performance.now();

            // Simulate realistic game tick
            zombieManager.update();

            // Move human players slightly to create dynamic LOD changes
            for (const player of humanPlayers) {
                player.position.x += (Math.random() - 0.5) * 2;
                player.position.y += (Math.random() - 0.5) * 2;
            }

            const tickEnd = performance.now();
            const tickTime = tickEnd - tickStart;
            tickTimes.push(tickTime);

            // Sample LOD distribution every 30 ticks
            if (tick % 30 === 0) {
                lodDistributions.push(zombieManager.getLODDistribution());
            }

            // Simulate 60 Hz timing
            const targetTickTime = 1000 / CONFIG.ticksPerSecond;
            const remainingTime = targetTickTime - tickTime;
            if (remainingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }
        }

        const endTime = performance.now();
        const totalTestTime = endTime - startTime;

        // Calculate statistics
        tickTimes.sort((a, b) => a - b);
        const avgTickTime = tickTimes.reduce((a, b) => a + b, 0) / tickTimes.length;
        const medianTickTime = tickTimes[Math.floor(tickTimes.length / 2)];
        const p95TickTime = tickTimes[Math.floor(tickTimes.length * 0.95)];
        const p99TickTime = tickTimes[Math.floor(tickTimes.length * 0.99)];
        const maxTickTime = Math.max(...tickTimes);

        // Calculate average LOD distribution
        const avgLODDistribution = lodDistributions.reduce((acc, dist) => {
            acc.high += dist.high;
            acc.medium += dist.medium;
            acc.low += dist.low;
            acc.minimal += dist.minimal;
            return acc;
        }, { high: 0, medium: 0, low: 0, minimal: 0 });

        Object.keys(avgLODDistribution).forEach(key => {
            avgLODDistribution[key] /= lodDistributions.length;
        });

        // Performance metrics
        const finalMetrics = zombieManager.getLODPerformanceMetrics();

        // Report results
        console.log("\n📈 REALISTIC PERFORMANCE TEST RESULTS");
        console.log("=" * 50);
        console.log(`🎯 Test Summary:
- Total Ticks: ${totalTicks}
- Total Test Time: ${totalTestTime.toFixed(2)}ms
- Actual Tick Rate: ${(totalTicks / (totalTestTime / 1000)).toFixed(1)} Hz
- Target Tick Rate: ${CONFIG.ticksPerSecond} Hz
`);

        console.log(`⏱️  Tick Performance:
- Average: ${avgTickTime.toFixed(3)}ms
- Median: ${medianTickTime.toFixed(3)}ms
- 95th Percentile: ${p95TickTime.toFixed(3)}ms
- 99th Percentile: ${p99TickTime.toFixed(3)}ms
- Maximum: ${maxTickTime.toFixed(3)}ms
- Target (60 Hz): ${(1000/60).toFixed(3)}ms
`);

        console.log(`🎮 LOD Distribution (Average):
- High Detail: ${avgLODDistribution.high.toFixed(1)} zombies
- Medium Detail: ${avgLODDistribution.medium.toFixed(1)} zombies
- Low Detail: ${avgLODDistribution.low.toFixed(1)} zombies
- Minimal Detail: ${avgLODDistribution.minimal.toFixed(1)} zombies
`);

        console.log(`📊 Final Metrics:
- Total Zombies: ${finalMetrics.totalZombies}
- Average Distance: ${finalMetrics.averageDistance.toFixed(1)} units
- Performance Score: ${finalMetrics.performanceScore.toFixed(1)}/100
`);

        // Performance assessment
        const isPerformant = p95TickTime < (1000 / CONFIG.ticksPerSecond);
        const lodEffective = avgLODDistribution.minimal > avgLODDistribution.high;

        console.log(`\n🏆 ASSESSMENT:
- Performance Target Met: ${isPerformant ? "✅ YES" : "❌ NO"}
- LOD System Effective: ${lodEffective ? "✅ YES" : "❌ NO"}
- Ready for Production: ${isPerformant && lodEffective ? "✅ YES" : "❌ NO"}
`);

        if (!isPerformant) {
            console.log(`⚠️  Performance Issue: 95th percentile (${p95TickTime.toFixed(3)}ms) exceeds target (${(1000/CONFIG.ticksPerSecond).toFixed(3)}ms)`);
        }

        if (!lodEffective) {
            console.log(`⚠️  LOD Issue: Too many high-detail zombies (${avgLODDistribution.high.toFixed(1)}) vs minimal (${avgLODDistribution.minimal.toFixed(1)})`);
        }

        return {
            avgTickTime,
            p95TickTime,
            lodDistribution: avgLODDistribution,
            performanceScore: finalMetrics.performanceScore,
            isPerformant,
            lodEffective
        };

    } catch (error) {
        console.error("❌ Test failed:", error);
        throw error;
    }
}

// Run the test
if (require.main === module) {
    createRealisticPerformanceTest()
        .then(results => {
            console.log("\n✅ Realistic performance test completed successfully");
            process.exit(results.isPerformant && results.lodEffective ? 0 : 1);
        })
        .catch(error => {
            console.error("\n❌ Realistic performance test failed:", error);
            process.exit(1);
        });
}

module.exports = { createRealisticPerformanceTest };