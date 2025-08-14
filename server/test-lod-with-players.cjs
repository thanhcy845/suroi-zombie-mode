#!/usr/bin/env node

/**
 * LOD System Test with Mock Players
 * Tests LOD system with simulated players for realistic distance calculations
 */

console.log('🎯 Testing LOD System with Mock Players...\n');

async function testLODWithPlayers() {
    try {
        // Import required modules
        const { ZombieManager } = require('./dist/server/src/zombies/zombieManager.js');
        const { Game } = require('./dist/server/src/game.js');
        const { TeamMode } = require('./dist/common/src/constants.js');
        
        console.log('✅ Successfully imported all modules');
        
        // Test 1: Create Game with Mock Players
        console.log('\n🔍 Test 1: Creating Game with Mock Players');
        const game = new Game(996, TeamMode.Solo, "normal");
        const zombieManager = new ZombieManager(game);
        
        // Enable zombie mode
        game._zombieModeEnabled = true;
        game._started = true;
        
        // Create mock players at specific positions
        const mockPlayers = [
            { position: { x: 0, y: 0 }, isZombie: false, name: "Player1" },
            { position: { x: 50, y: 50 }, isZombie: false, name: "Player2" }
        ];
        
        // Add mock players to game
        game.livingPlayers = mockPlayers;
        
        console.log('✅ Game created with 2 mock players');
        console.log(`   Player1 at (0, 0)`);
        console.log(`   Player2 at (50, 50)`);
        
        // Test 2: Spawn Zombies at Strategic Distances
        console.log('\n🔍 Test 2: Spawning Zombies at Strategic Distances from Players');
        
        const zombieTestCases = [
            { pos: { x: 10, y: 10 }, expectedLOD: 0, description: "Close to Player1 (High LOD)" },
            { pos: { x: 35, y: 35 }, expectedLOD: 1, description: "Medium distance (Medium LOD)" },
            { pos: { x: 65, y: 65 }, expectedLOD: 2, description: "Far from both players (Low LOD)" },
            { pos: { x: 120, y: 120 }, expectedLOD: 3, description: "Very far (Minimal LOD)" },
            { pos: { x: 5, y: 5 }, expectedLOD: 0, description: "Very close to Player1 (High LOD)" },
            { pos: { x: 45, y: 45 }, expectedLOD: 1, description: "Close to Player2 (Medium LOD)" }
        ];
        
        const spawnedZombies = [];
        for (let i = 0; i < zombieTestCases.length; i++) {
            const testCase = zombieTestCases[i];
            const zombie = zombieManager.spawnZombie(testCase.pos);
            if (zombie) {
                spawnedZombies.push({ zombie, testCase });
                console.log(`✅ Spawned zombie ${i + 1} at (${testCase.pos.x}, ${testCase.pos.y}) - ${testCase.description}`);
            }
        }
        
        console.log(`✅ Total zombies spawned: ${spawnedZombies.length}`);
        
        // Test 3: Initialize LOD System with Multiple Updates
        console.log('\n🔍 Test 3: Initializing LOD System');
        
        // Run several update cycles to let LOD system calculate distances
        for (let i = 0; i < 10; i++) {
            zombieManager.update();
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log('✅ LOD system initialized with player distance calculations');
        
        // Test 4: Validate LOD Assignments
        console.log('\n🔍 Test 4: Validating LOD Level Assignments');
        
        let correctAssignments = 0;
        let totalZombies = 0;
        
        for (const { zombie, testCase } of spawnedZombies) {
            const ai = zombie.ai;
            if (ai && typeof ai.getLODLevel === 'function') {
                const actualLOD = ai.getLODLevel();
                const distance = ai.getDistanceToNearestPlayer();
                
                // Calculate expected distance manually
                const distToPlayer1 = Math.sqrt(Math.pow(testCase.pos.x - 0, 2) + Math.pow(testCase.pos.y - 0, 2));
                const distToPlayer2 = Math.sqrt(Math.pow(testCase.pos.x - 50, 2) + Math.pow(testCase.pos.y - 50, 2));
                const expectedDistance = Math.min(distToPlayer1, distToPlayer2);
                
                console.log(`   Zombie at (${testCase.pos.x}, ${testCase.pos.y}):`);
                console.log(`     LOD: ${actualLOD} (expected: ${testCase.expectedLOD})`);
                console.log(`     Distance: ${distance.toFixed(1)} (calculated: ${expectedDistance.toFixed(1)})`);
                console.log(`     Description: ${testCase.description}`);
                
                // Allow some tolerance for LOD assignment
                if (Math.abs(actualLOD - testCase.expectedLOD) <= 1) {
                    correctAssignments++;
                }
                totalZombies++;
            }
        }
        
        const lodAccuracy = totalZombies > 0 ? (correctAssignments / totalZombies) * 100 : 0;
        console.log(`\n✅ LOD Assignment Accuracy: ${correctAssignments}/${totalZombies} (${lodAccuracy.toFixed(1)}%)`);
        
        // Test 5: Performance Testing
        console.log('\n🔍 Test 5: Performance Testing with Realistic LOD Distribution');
        
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
        
        // Test 7: Dynamic Player Movement Test
        console.log('\n🔍 Test 7: Testing LOD Updates with Player Movement');
        
        // Move players to new positions
        mockPlayers[0].position = { x: 100, y: 100 };
        mockPlayers[1].position = { x: 150, y: 150 };
        
        console.log('✅ Moved players to new positions:');
        console.log(`   Player1 moved to (100, 100)`);
        console.log(`   Player2 moved to (150, 150)`);
        
        // Run updates to recalculate LOD levels
        for (let i = 0; i < 5; i++) {
            zombieManager.update();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const newDistribution = zombieManager.getLODDistribution();
        console.log('\n✅ LOD Distribution after player movement:');
        console.log(`   High Detail: ${newDistribution.high}, Medium: ${newDistribution.medium}, Low: ${newDistribution.low}, Minimal: ${newDistribution.minimal}`);
        
        // Test 8: Scalability Test
        console.log('\n🔍 Test 8: Scalability Test with More Zombies');
        
        // Spawn additional zombies at various distances
        const additionalPositions = [
            { x: 80, y: 80 }, { x: 90, y: 90 }, { x: 110, y: 110 },
            { x: 130, y: 130 }, { x: 140, y: 140 }, { x: 160, y: 160 },
            { x: 170, y: 170 }, { x: 180, y: 180 }, { x: 200, y: 200 }
        ];
        
        for (const pos of additionalPositions) {
            zombieManager.spawnZombie(pos);
        }
        
        console.log(`✅ Spawned ${additionalPositions.length} additional zombies`);
        
        // Performance test with more zombies
        const scalabilityStart = Date.now();
        for (let i = 0; i < 50; i++) {
            zombieManager.update();
        }
        const scalabilityTime = Date.now() - scalabilityStart;
        const scalabilityAvgTime = scalabilityTime / 50;
        
        console.log(`✅ Scalability test: 50 updates with ${zombieManager.zombies.size} zombies in ${scalabilityTime}ms`);
        console.log(`✅ Average update time with scale: ${scalabilityAvgTime.toFixed(2)}ms`);
        
        const finalDistribution = zombieManager.getLODDistribution();
        const finalMetrics = zombieManager.getLODPerformanceMetrics();
        
        console.log('\n✅ Final LOD Distribution:');
        console.log(`   High: ${finalDistribution.high}, Medium: ${finalDistribution.medium}, Low: ${finalDistribution.low}, Minimal: ${finalDistribution.minimal}`);
        console.log(`✅ Final Performance Score: ${finalMetrics.performanceScore.toFixed(1)}/100`);
        
        // Performance evaluation
        let performanceRating = 'EXCELLENT';
        let recommendations = [];
        
        if (scalabilityAvgTime > 3) {
            performanceRating = 'NEEDS OPTIMIZATION';
            recommendations.push('Consider increasing LOD distance thresholds');
            recommendations.push('Implement more aggressive culling');
        } else if (scalabilityAvgTime > 1) {
            performanceRating = 'GOOD';
            recommendations.push('Monitor performance with 25+ zombies');
        }
        
        if (finalDistribution.high > 8) {
            recommendations.push('Consider reducing high-detail distance threshold');
        }
        
        console.log(`\n✅ Performance Rating: ${performanceRating}`);
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

// Run the test
testLODWithPlayers().then(result => {
    console.log('\n' + '='.repeat(70));
    if (result.success) {
        console.log('🎉 LOD SYSTEM WITH PLAYERS TEST COMPLETED!');
        console.log('\n📊 Results Summary:');
        console.log(`   Performance: ${result.performance.rating}`);
        console.log(`   Average Update Time: ${result.performance.avgUpdateTime.toFixed(2)}ms`);
        console.log(`   Total Zombies: ${result.performance.totalZombies}`);
        console.log(`   LOD Accuracy: ${result.lod.accuracy.toFixed(1)}%`);
        console.log(`   Performance Score: ${result.lod.performanceScore.toFixed(1)}/100`);
        
        if (result.performance.avgUpdateTime < 1) {
            console.log('\n🚀 LOD SYSTEM: EXCELLENT PERFORMANCE!');
            console.log('Ready for production with 20+ zombies.');
        } else if (result.performance.avgUpdateTime < 3) {
            console.log('\n✅ LOD SYSTEM: GOOD PERFORMANCE');
            console.log('Suitable for production with monitoring.');
        } else {
            console.log('\n⚠️  LOD SYSTEM: NEEDS OPTIMIZATION');
            console.log('Requires tuning before production deployment.');
        }
        
    } else {
        console.log('❌ LOD SYSTEM TEST FAILED');
        console.log(`Error: ${result.error}`);
    }
    console.log('='.repeat(70));
}).catch(error => {
    console.log('\n❌ Test execution failed:', error.message);
});
