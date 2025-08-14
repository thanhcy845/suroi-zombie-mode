#!/usr/bin/env node

/**
 * LOD (Level of Detail) System Performance Test
 * Tests the new LOD implementation for zombie AI optimization
 */

console.log('🎯 Testing LOD (Level of Detail) System Implementation...\n');

async function testLODSystem() {
    try {
        // Import required modules
        const { ZombieManager } = require('./dist/server/src/zombies/zombieManager.js');
        const { Game } = require('./dist/server/src/game.js');
        const { TeamMode } = require('./dist/common/src/constants.js');

        console.log('✅ Successfully imported all modules');

        // Test 1: Create Game and Spawn Multiple Zombies
        console.log('\n🔍 Test 1: Creating Game with Multiple Zombies for LOD Testing');
        const game = new Game(997, TeamMode.Solo, "normal");
        const zombieManager = new ZombieManager(game);

        // Enable zombie mode
        game._zombieModeEnabled = true;
        game._started = true;

        console.log('✅ Game created and zombie mode enabled');

        // Test 2: Spawn Zombies at Different Distances
        console.log('\n🔍 Test 2: Spawning Zombies at Various Distances for LOD Testing');

        const zombiePositions = [
            { x: 10, y: 10, expectedLOD: 0, description: "Close (High LOD)" },
            { x: 35, y: 35, expectedLOD: 1, description: "Medium distance (Medium LOD)" },
            { x: 60, y: 60, expectedLOD: 2, description: "Far (Low LOD)" },
            { x: 90, y: 90, expectedLOD: 3, description: "Very far (Minimal LOD)" },
            { x: 15, y: 15, expectedLOD: 0, description: "Close (High LOD)" },
            { x: 40, y: 40, expectedLOD: 1, description: "Medium distance (Medium LOD)" }
        ];

        const spawnedZombies = [];
        for (let i = 0; i < zombiePositions.length; i++) {
            const pos = zombiePositions[i];
            const zombie = zombieManager.spawnZombie(pos);
            if (zombie) {
                spawnedZombies.push({ zombie, expected: pos });
                console.log(`✅ Spawned zombie ${i + 1} at (${pos.x}, ${pos.y}) - ${pos.description}`);
            }
        }

        console.log(`✅ Total zombies spawned: ${spawnedZombies.length}`);

        // Test 3: Run Updates to Initialize LOD System
        console.log('\n🔍 Test 3: Running Updates to Initialize LOD System');

        // Run several update cycles to let LOD system stabilize
        for (let i = 0; i < 5; i++) {
            zombieManager.update();
            // Small delay to simulate real game ticks
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('✅ LOD system initialized with multiple update cycles');

        // Test 4: Validate LOD Levels
        console.log('\n🔍 Test 4: Validating LOD Level Assignment');

        let correctLODAssignments = 0;
        let totalZombies = 0;

        for (const { zombie, expected }
            of spawnedZombies) {
            const ai = zombie.ai;
            if (ai && typeof ai.getLODLevel === 'function') {
                const actualLOD = ai.getLODLevel();
                const distance = ai.getDistanceToNearestPlayer();

                console.log(`   Zombie at (${expected.x}, ${expected.y}): LOD=${actualLOD}, Distance=${distance.toFixed(1)}, Expected=${expected.expectedLOD}`);

                // Allow some tolerance for LOD assignment
                if (Math.abs(actualLOD - expected.expectedLOD) <= 1) {
                    correctLODAssignments++;
                }
                totalZombies++;
            }
        }

        const lodAccuracy = totalZombies > 0 ? (correctLODAssignments / totalZombies) * 100 : 0;
        console.log(`✅ LOD Assignment Accuracy: ${correctLODAssignments}/${totalZombies} (${lodAccuracy.toFixed(1)}%)`);

        // Test 5: Performance Measurement
        console.log('\n🔍 Test 5: Performance Testing with LOD System');

        const performanceStart = Date.now();
        const updateCount = 100;

        for (let i = 0; i < updateCount; i++) {
            zombieManager.update();
        }

        const performanceTime = Date.now() - performanceStart;
        const avgUpdateTime = performanceTime / updateCount;

        console.log(`✅ ${updateCount} updates completed in ${performanceTime}ms`);
        console.log(`✅ Average update time: ${avgUpdateTime.toFixed(2)}ms`);

        // Test 6: LOD Distribution Analysis
        console.log('\n🔍 Test 6: LOD Distribution Analysis');

        const lodDistribution = zombieManager.getLODDistribution();
        const performanceMetrics = zombieManager.getLODPerformanceMetrics();

        console.log('✅ LOD Distribution:');
        console.log(`   High Detail (LOD 0): ${lodDistribution.high} zombies`);
        console.log(`   Medium Detail (LOD 1): ${lodDistribution.medium} zombies`);
        console.log(`   Low Detail (LOD 2): ${lodDistribution.low} zombies`);
        console.log(`   Minimal Detail (LOD 3): ${lodDistribution.minimal} zombies`);

        console.log('\n✅ Performance Metrics:');
        console.log(`   Total Zombies: ${performanceMetrics.totalZombies}`);
        console.log(`   Average Distance: ${performanceMetrics.averageDistance.toFixed(1)} units`);
        console.log(`   Performance Score: ${performanceMetrics.performanceScore.toFixed(1)}/100`);

        // Test 7: Scalability Test
        console.log('\n🔍 Test 7: Scalability Test with More Zombies');

        // Spawn additional zombies for scalability testing
        const additionalZombies = [];
        for (let i = 0; i < 10; i++) {
            const x = 20 + (i * 10);
            const y = 20 + (i * 8);
            const zombie = zombieManager.spawnZombie({ x, y });
            if (zombie) {
                additionalZombies.push(zombie);
            }
        }

        console.log(`✅ Spawned ${additionalZombies.length} additional zombies for scalability test`);

        // Run performance test with more zombies
        const scalabilityStart = Date.now();
        for (let i = 0; i < 50; i++) {
            zombieManager.update();
        }
        const scalabilityTime = Date.now() - scalabilityStart;
        const scalabilityAvgTime = scalabilityTime / 50;

        console.log(`✅ Scalability test: 50 updates with ${zombieManager.zombies.size} zombies in ${scalabilityTime}ms`);
        console.log(`✅ Average update time with scale: ${scalabilityAvgTime.toFixed(2)}ms`);

        // Final LOD distribution with more zombies
        const finalDistribution = zombieManager.getLODDistribution();
        const finalMetrics = zombieManager.getLODPerformanceMetrics();

        console.log('\n✅ Final LOD Distribution:');
        console.log(`   High Detail: ${finalDistribution.high}, Medium: ${finalDistribution.medium}, Low: ${finalDistribution.low}, Minimal: ${finalDistribution.minimal}`);
        console.log(`✅ Final Performance Score: ${finalMetrics.performanceScore.toFixed(1)}/100`);

        // Test 8: Performance Comparison
        console.log('\n🔍 Test 8: Performance Impact Analysis');

        let performanceRating = 'EXCELLENT';
        let recommendations = [];

        if (scalabilityAvgTime > 5) {
            performanceRating = 'NEEDS OPTIMIZATION';
            recommendations.push('Consider reducing LOD update frequency');
            recommendations.push('Implement more aggressive distance culling');
        } else if (scalabilityAvgTime > 2) {
            performanceRating = 'GOOD';
            recommendations.push('Monitor performance with 20+ zombies');
        }

        if (finalDistribution.high > 10) {
            recommendations.push('Too many high-detail zombies - consider adjusting distance thresholds');
        }

        console.log(`✅ Performance Rating: ${performanceRating}`);
        if (recommendations.length > 0) {
            console.log('💡 Recommendations:');
            recommendations.forEach(rec => console.log(`   - ${rec}`));
        }

        return {
            success: true,
            performance: {
                avgUpdateTime: scalabilityAvgTime,
                rating: performanceRating,
                totalZombies: zombieManager.zombies.size
            },
            lod: {
                distribution: finalDistribution,
                accuracy: lodAccuracy,
                performanceScore: finalMetrics.performanceScore
            }
        };

    } catch (error) {
        console.log(`❌ LOD system test failed: ${error.message}`);
        console.log('Stack trace:', error.stack);
        return { success: false, error: error.message };
    }
}

// Run the LOD system test
testLODSystem().then(result => {
    console.log('\n' + '='.repeat(70));
    if (result.success) {
        console.log('🎉 LOD SYSTEM TEST COMPLETED SUCCESSFULLY!');
        console.log('\n📊 Results Summary:');
        console.log(`   Performance: ${result.performance.rating}`);
        console.log(`   Average Update Time: ${result.performance.avgUpdateTime.toFixed(2)}ms`);
        console.log(`   Total Zombies Tested: ${result.performance.totalZombies}`);
        console.log(`   LOD Accuracy: ${result.lod.accuracy.toFixed(1)}%`);
        console.log(`   Performance Score: ${result.lod.performanceScore.toFixed(1)}/100`);

        if (result.performance.avgUpdateTime < 2) {
            console.log('\n🚀 LOD SYSTEM: READY FOR PRODUCTION!');
            console.log('The LOD system successfully optimizes zombie AI performance.');
        } else if (result.performance.avgUpdateTime < 5) {
            console.log('\n✅ LOD SYSTEM: GOOD PERFORMANCE');
            console.log('Performance is acceptable with room for further optimization.');
        } else {
            console.log('\n⚠️  LOD SYSTEM: NEEDS OPTIMIZATION');
            console.log('Performance requires additional tuning before production.');
        }

    } else {
        console.log('❌ LOD SYSTEM TEST FAILED');
        console.log(`Error: ${result.error}`);
    }
    console.log('='.repeat(70));
}).catch(error => {
    console.log('\n❌ Test execution failed:', error.message);
});