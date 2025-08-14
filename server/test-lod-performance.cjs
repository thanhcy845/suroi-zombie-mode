#!/usr/bin/env node

/**
 * LOD System Performance Validation Test
 * Tests the LOD system performance improvements and scalability
 */

console.log('🎯 Testing LOD System Performance Improvements...\n');

async function testLODPerformance() {
    try {
        // Import required modules
        const { ZombieManager } = require('./dist/server/src/zombies/zombieManager.js');
        const { Game } = require('./dist/server/src/game.js');
        const { TeamMode } = require('./dist/common/src/constants.js');
        
        console.log('✅ Successfully imported all modules');
        
        // Test 1: Baseline Performance (No LOD)
        console.log('\n🔍 Test 1: Baseline Performance Measurement');
        const game = new Game(995, TeamMode.Solo, "normal");
        const zombieManager = new ZombieManager(game);
        
        // Enable zombie mode
        game._zombieModeEnabled = true;
        game._started = true;
        
        console.log('✅ Game created for performance testing');
        
        // Test 2: Spawn Multiple Zombies for Performance Testing
        console.log('\n🔍 Test 2: Spawning Zombies for Performance Testing');
        
        const zombiePositions = [];
        const spawnedZombies = [];
        
        // Create a grid of zombie positions
        for (let x = 10; x <= 200; x += 20) {
            for (let y = 10; y <= 100; y += 20) {
                zombiePositions.push({ x, y });
            }
        }
        
        console.log(`✅ Generated ${zombiePositions.length} zombie spawn positions`);
        
        // Spawn zombies in batches to test scalability
        const batchSizes = [5, 10, 15, 20, 25];
        const performanceResults = [];
        
        for (const batchSize of batchSizes) {
            console.log(`\n🔍 Testing with ${batchSize} zombies:`);
            
            // Clear existing zombies
            for (const zombie of spawnedZombies) {
                zombieManager.removeZombie(zombie);
            }
            spawnedZombies.length = 0;
            
            // Spawn new batch
            for (let i = 0; i < batchSize && i < zombiePositions.length; i++) {
                const pos = zombiePositions[i];
                const zombie = zombieManager.spawnZombie(pos);
                if (zombie) {
                    spawnedZombies.push(zombie);
                }
            }
            
            console.log(`   ✅ Spawned ${spawnedZombies.length} zombies`);
            
            // Let LOD system initialize
            for (let i = 0; i < 3; i++) {
                zombieManager.update();
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            // Performance test
            const performanceStart = Date.now();
            const updateCount = 100;
            
            for (let i = 0; i < updateCount; i++) {
                zombieManager.update();
            }
            
            const performanceTime = Date.now() - performanceStart;
            const avgUpdateTime = performanceTime / updateCount;
            
            // Get LOD distribution
            const lodDistribution = zombieManager.getLODDistribution();
            const performanceMetrics = zombieManager.getLODPerformanceMetrics();
            
            const result = {
                zombieCount: batchSize,
                actualZombies: spawnedZombies.length,
                totalTime: performanceTime,
                avgUpdateTime: avgUpdateTime,
                lodDistribution: lodDistribution,
                performanceScore: performanceMetrics.performanceScore
            };
            
            performanceResults.push(result);
            
            console.log(`   📊 Performance: ${avgUpdateTime.toFixed(2)}ms avg update time`);
            console.log(`   📊 LOD Distribution: H:${lodDistribution.high} M:${lodDistribution.medium} L:${lodDistribution.low} Min:${lodDistribution.minimal}`);
            console.log(`   📊 Performance Score: ${performanceMetrics.performanceScore.toFixed(1)}/100`);
            
            // Performance rating
            let rating = 'EXCELLENT';
            if (avgUpdateTime > 5) rating = 'POOR';
            else if (avgUpdateTime > 2) rating = 'NEEDS_OPTIMIZATION';
            else if (avgUpdateTime > 1) rating = 'GOOD';
            
            console.log(`   🎯 Rating: ${rating}`);
        }
        
        // Test 3: Performance Analysis
        console.log('\n🔍 Test 3: Performance Analysis & Scalability Assessment');
        
        console.log('\n📊 Performance Results Summary:');
        console.log('Zombies | Avg Time | LOD Distribution | Score | Rating');
        console.log('--------|----------|------------------|-------|--------');
        
        for (const result of performanceResults) {
            const rating = result.avgUpdateTime <= 1 ? 'EXCELLENT' : 
                          result.avgUpdateTime <= 2 ? 'GOOD' : 
                          result.avgUpdateTime <= 5 ? 'NEEDS_OPT' : 'POOR';
            
            console.log(`${result.zombieCount.toString().padStart(7)} | ${result.avgUpdateTime.toFixed(2).padStart(8)}ms | H:${result.lodDistribution.high} M:${result.lodDistribution.medium} L:${result.lodDistribution.low} Min:${result.lodDistribution.minimal.toString().padStart(2)} | ${result.performanceScore.toFixed(1).padStart(5)} | ${rating}`);
        }
        
        // Test 4: LOD System Effectiveness Analysis
        console.log('\n🔍 Test 4: LOD System Effectiveness Analysis');
        
        const maxResult = performanceResults[performanceResults.length - 1];
        const minResult = performanceResults[0];
        
        const scalabilityFactor = maxResult.avgUpdateTime / minResult.avgUpdateTime;
        const efficiencyScore = Math.max(0, 100 - (maxResult.avgUpdateTime * 10));
        
        console.log(`✅ Scalability Analysis:`);
        console.log(`   Min zombies (${minResult.zombieCount}): ${minResult.avgUpdateTime.toFixed(2)}ms`);
        console.log(`   Max zombies (${maxResult.zombieCount}): ${maxResult.avgUpdateTime.toFixed(2)}ms`);
        console.log(`   Scalability factor: ${scalabilityFactor.toFixed(2)}x`);
        console.log(`   Efficiency score: ${efficiencyScore.toFixed(1)}/100`);
        
        // Test 5: LOD Distribution Effectiveness
        console.log('\n🔍 Test 5: LOD Distribution Effectiveness');
        
        const totalZombies = maxResult.actualZombies;
        const highDetailRatio = maxResult.lodDistribution.high / totalZombies;
        const minimalDetailRatio = maxResult.lodDistribution.minimal / totalZombies;
        
        console.log(`✅ LOD Distribution Analysis (${totalZombies} zombies):`);
        console.log(`   High Detail: ${maxResult.lodDistribution.high} (${(highDetailRatio * 100).toFixed(1)}%)`);
        console.log(`   Medium Detail: ${maxResult.lodDistribution.medium} (${(maxResult.lodDistribution.medium / totalZombies * 100).toFixed(1)}%)`);
        console.log(`   Low Detail: ${maxResult.lodDistribution.low} (${(maxResult.lodDistribution.low / totalZombies * 100).toFixed(1)}%)`);
        console.log(`   Minimal Detail: ${maxResult.lodDistribution.minimal} (${(minimalDetailRatio * 100).toFixed(1)}%)`);
        
        // Test 6: Production Readiness Assessment
        console.log('\n🔍 Test 6: Production Readiness Assessment');
        
        let productionRating = 'EXCELLENT';
        let recommendations = [];
        
        if (maxResult.avgUpdateTime > 3) {
            productionRating = 'NOT_READY';
            recommendations.push('Optimize LOD thresholds for better performance');
            recommendations.push('Consider implementing zombie culling');
        } else if (maxResult.avgUpdateTime > 1.5) {
            productionRating = 'NEEDS_MONITORING';
            recommendations.push('Monitor performance with real players');
            recommendations.push('Consider stress testing with 30+ zombies');
        } else if (scalabilityFactor > 3) {
            productionRating = 'GOOD';
            recommendations.push('Performance degrades with scale - monitor closely');
        }
        
        if (highDetailRatio > 0.4) {
            recommendations.push('Too many high-detail zombies - adjust distance thresholds');
        }
        
        console.log(`✅ Production Readiness: ${productionRating}`);
        
        if (recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            recommendations.forEach(rec => console.log(`   - ${rec}`));
        } else {
            console.log('\n🚀 No optimization needed - ready for production!');
        }
        
        // Test 7: Target Performance Validation
        console.log('\n🔍 Test 7: Target Performance Validation');
        
        const targetZombies = 20;
        const targetPerformance = 2.0; // 2ms max average update time
        
        const targetResult = performanceResults.find(r => r.zombieCount >= targetZombies) || maxResult;
        const meetsTarget = targetResult.avgUpdateTime <= targetPerformance;
        
        console.log(`✅ Target Performance Check (${targetZombies} zombies):`);
        console.log(`   Target: ≤${targetPerformance}ms average update time`);
        console.log(`   Actual: ${targetResult.avgUpdateTime.toFixed(2)}ms`);
        console.log(`   Result: ${meetsTarget ? '✅ MEETS TARGET' : '❌ BELOW TARGET'}`);
        
        return {
            success: true,
            performance: {
                results: performanceResults,
                scalabilityFactor: scalabilityFactor,
                efficiencyScore: efficiencyScore,
                productionRating: productionRating,
                meetsTarget: meetsTarget
            },
            lod: {
                maxZombies: maxResult.actualZombies,
                finalDistribution: maxResult.lodDistribution,
                highDetailRatio: highDetailRatio
            }
        };
        
    } catch (error) {
        console.log(`❌ LOD performance test failed: ${error.message}`);
        console.log('Stack trace:', error.stack);
        return { success: false, error: error.message };
    }
}

// Run the performance test
testLODPerformance().then(result => {
    console.log('\n' + '='.repeat(70));
    if (result.success) {
        console.log('🎉 LOD SYSTEM PERFORMANCE TEST COMPLETED!');
        console.log('\n📊 Final Assessment:');
        console.log(`   Production Rating: ${result.performance.productionRating}`);
        console.log(`   Scalability Factor: ${result.performance.scalabilityFactor.toFixed(2)}x`);
        console.log(`   Efficiency Score: ${result.performance.efficiencyScore.toFixed(1)}/100`);
        console.log(`   Target Performance: ${result.performance.meetsTarget ? 'MET' : 'NOT MET'}`);
        console.log(`   Max Zombies Tested: ${result.lod.maxZombies}`);
        console.log(`   High Detail Ratio: ${(result.lod.highDetailRatio * 100).toFixed(1)}%`);
        
        if (result.performance.productionRating === 'EXCELLENT') {
            console.log('\n🚀 LOD SYSTEM: PRODUCTION READY!');
            console.log('Excellent performance scaling with LOD optimization.');
        } else if (result.performance.productionRating === 'GOOD' || result.performance.productionRating === 'NEEDS_MONITORING') {
            console.log('\n✅ LOD SYSTEM: READY WITH MONITORING');
            console.log('Good performance but requires monitoring in production.');
        } else {
            console.log('\n⚠️  LOD SYSTEM: NEEDS OPTIMIZATION');
            console.log('Performance requires improvement before production.');
        }
        
    } else {
        console.log('❌ LOD SYSTEM PERFORMANCE TEST FAILED');
        console.log(`Error: ${result.error}`);
    }
    console.log('='.repeat(70));
}).catch(error => {
    console.log('\n❌ Test execution failed:', error.message);
});
