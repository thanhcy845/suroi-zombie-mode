// Comprehensive Zombie System Test Suite
const { ZombieTypes, EvolutionMultipliers, ZombieSpawnWeights } = require('./dist/server/src/zombies/zombieTypes.js');

console.log('🧟 Running Comprehensive Zombie System Test Suite...\n');

let testsPassed = 0;
let testsTotal = 0;

function runTest(testName, testFunction) {
    testsTotal++;
    try {
        testFunction();
        console.log(`✅ ${testName}`);
        testsPassed++;
    } catch (error) {
        console.log(`❌ ${testName}: ${error.message}`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// Test 1: Zombie Type System
runTest('Zombie Type Definitions', () => {
    const basicZombie = ZombieTypes.fromString('basic_zombie');
    const fastRunner = ZombieTypes.fromString('fast_runner');
    const tankZombie = ZombieTypes.fromString('tank_zombie');
    
    assert(basicZombie.name === 'Basic Zombie', 'Basic zombie name incorrect');
    assert(fastRunner.name === 'Fast Runner', 'Fast runner name incorrect');
    assert(tankZombie.name === 'Tank Zombie', 'Tank zombie name incorrect');
});

// Test 2: Zombie Stats Balance
runTest('Zombie Stats Balance', () => {
    const basicZombie = ZombieTypes.fromString('basic_zombie');
    const fastRunner = ZombieTypes.fromString('fast_runner');
    const tankZombie = ZombieTypes.fromString('tank_zombie');
    
    assert(fastRunner.speed > basicZombie.speed, 'Fast runner should be faster');
    assert(tankZombie.health > basicZombie.health, 'Tank should have more health');
    assert(tankZombie.damage > basicZombie.damage, 'Tank should deal more damage');
    assert(fastRunner.health < tankZombie.health, 'Fast runner should have less health than tank');
});

// Test 3: Behavioral Properties
runTest('Zombie Behavioral Properties', () => {
    const basicZombie = ZombieTypes.fromString('basic_zombie');
    const fastRunner = ZombieTypes.fromString('fast_runner');
    const tankZombie = ZombieTypes.fromString('tank_zombie');
    
    assert(basicZombie.packBehavior === true, 'Basic zombie should have pack behavior');
    assert(fastRunner.packBehavior === false, 'Fast runner should be solo');
    assert(tankZombie.packBehavior === true, 'Tank zombie should have pack behavior');
    
    assert(fastRunner.aggressionLevel > basicZombie.aggressionLevel, 'Fast runner should be more aggressive');
    assert(fastRunner.detectionRange > basicZombie.detectionRange, 'Fast runner should have better detection');
});

// Test 4: Evolution System
runTest('Evolution Multipliers', () => {
    const healthMults = EvolutionMultipliers.health;
    const speedMults = EvolutionMultipliers.speed;
    const damageMults = EvolutionMultipliers.damage;
    
    assert(healthMults.length === 4, 'Should have 4 evolution levels');
    assert(healthMults[0] === 1.0, 'Base level should be 1.0x');
    assert(healthMults[3] === 2.0, 'Final level should be 2.0x health');
    assert(damageMults[3] === 2.3, 'Final level should be 2.3x damage');
    
    // Test progression
    for (let i = 1; i < healthMults.length; i++) {
        assert(healthMults[i] > healthMults[i-1], `Health should increase at level ${i}`);
        assert(speedMults[i] > speedMults[i-1], `Speed should increase at level ${i}`);
        assert(damageMults[i] > damageMults[i-1], `Damage should increase at level ${i}`);
    }
});

// Test 5: Spawn Weight System
runTest('Spawn Weight System', () => {
    const earlyWeights = ZombieSpawnWeights.early;
    const midWeights = ZombieSpawnWeights.mid;
    const lateWeights = ZombieSpawnWeights.late;
    
    assert(earlyWeights.basic_zombie > earlyWeights.tank_zombie, 'Early game should favor basic zombies');
    assert(lateWeights.tank_zombie > earlyWeights.tank_zombie, 'Late game should have more tank zombies');
    
    // Test weights sum to 1.0
    const earlySum = Object.values(earlyWeights).reduce((a, b) => a + b, 0);
    const midSum = Object.values(midWeights).reduce((a, b) => a + b, 0);
    const lateSum = Object.values(lateWeights).reduce((a, b) => a + b, 0);
    
    assert(Math.abs(earlySum - 1.0) < 0.01, 'Early weights should sum to 1.0');
    assert(Math.abs(midSum - 1.0) < 0.01, 'Mid weights should sum to 1.0');
    assert(Math.abs(lateSum - 1.0) < 0.01, 'Late weights should sum to 1.0');
});

// Test 6: Type Lookup System
runTest('Type Lookup System', () => {
    // Test valid lookups
    const basic = ZombieTypes.fromString('basic_zombie');
    assert(basic.idString === 'basic_zombie', 'Lookup should return correct type');
    
    const fast = ZombieTypes.fromStringSafe('fast_runner');
    assert(fast && fast.idString === 'fast_runner', 'Safe lookup should work');
    
    const invalid = ZombieTypes.fromStringSafe('invalid_type');
    assert(invalid === undefined, 'Safe lookup should return undefined for invalid types');
    
    // Test error handling
    try {
        ZombieTypes.fromString('invalid_type');
        assert(false, 'Should throw error for invalid type');
    } catch (error) {
        assert(error.message.includes('Unknown zombie type'), 'Should throw appropriate error');
    }
});

// Test 7: Evolution Calculation
runTest('Evolution Calculation', () => {
    const baseHealth = 120;
    const baseSpeed = 0.8;
    const baseDamage = 25;
    
    // Test each evolution level
    for (let level = 0; level < EvolutionMultipliers.health.length; level++) {
        const healthMult = EvolutionMultipliers.health[level];
        const speedMult = EvolutionMultipliers.speed[level];
        const damageMult = EvolutionMultipliers.damage[level];
        
        const evolvedHealth = Math.floor(baseHealth * healthMult);
        const evolvedSpeed = baseSpeed * speedMult;
        const evolvedDamage = Math.floor(baseDamage * damageMult);
        
        assert(evolvedHealth >= baseHealth, `Evolved health should be >= base at level ${level}`);
        assert(evolvedSpeed >= baseSpeed, `Evolved speed should be >= base at level ${level}`);
        assert(evolvedDamage >= baseDamage, `Evolved damage should be >= base at level ${level}`);
    }
});

// Test 8: Game Balance
runTest('Game Balance Validation', () => {
    // Test that zombies start weaker than typical player
    const basicZombie = ZombieTypes.fromString('basic_zombie');
    const playerHealth = 100; // Typical player health
    
    assert(basicZombie.health > playerHealth, 'Zombies should have more health than players');
    assert(basicZombie.speed < 1.0, 'Basic zombies should be slower than players initially');
    
    // Test final evolution is challenging but not overpowered
    const finalHealthMult = EvolutionMultipliers.health[3];
    const finalDamageMult = EvolutionMultipliers.damage[3];
    const finalHealth = basicZombie.health * finalHealthMult;
    const finalDamage = basicZombie.damage * finalDamageMult;
    
    assert(finalHealth < 300, 'Final zombie health should not exceed 300');
    assert(finalDamage < 100, 'Final zombie damage should not exceed 100');
});

// Test 9: Type Diversity
runTest('Type Diversity', () => {
    const types = ZombieTypes.definitions;
    
    assert(types.length === 3, 'Should have exactly 3 zombie types');
    
    // Test that each type has unique characteristics
    const speeds = types.map(t => t.speed);
    const healths = types.map(t => t.health);
    const damages = types.map(t => t.damage);
    
    assert(new Set(speeds).size === 3, 'All zombie types should have different speeds');
    assert(new Set(healths).size === 3, 'All zombie types should have different health values');
    assert(new Set(damages).size === 3, 'All zombie types should have different damage values');
});

// Test 10: Configuration Completeness
runTest('Configuration Completeness', () => {
    const types = ZombieTypes.definitions;
    
    for (const type of types) {
        assert(type.idString && type.idString.length > 0, `${type.name} should have idString`);
        assert(type.name && type.name.length > 0, `${type.idString} should have name`);
        assert(type.health > 0, `${type.name} should have positive health`);
        assert(type.speed > 0, `${type.name} should have positive speed`);
        assert(type.damage > 0, `${type.name} should have positive damage`);
        assert(type.attackRange > 0, `${type.name} should have positive attack range`);
        assert(type.detectionRange > 0, `${type.name} should have positive detection range`);
        assert(type.skin && type.skin.length > 0, `${type.name} should have skin`);
        assert(typeof type.aggressionLevel === 'number', `${type.name} should have aggression level`);
        assert(typeof type.packBehavior === 'boolean', `${type.name} should have pack behavior setting`);
    }
});

// Print Results
console.log('\n' + '='.repeat(50));
console.log(`🧟 Comprehensive Test Results: ${testsPassed}/${testsTotal} tests passed`);
console.log('='.repeat(50));

if (testsPassed === testsTotal) {
    console.log('🎉 All zombie system tests passed successfully!');
    console.log('\n✅ Zombie System Status: FULLY FUNCTIONAL');
    console.log('✅ Ready for integration and gameplay testing');
} else {
    console.log(`⚠️  ${testsTotal - testsPassed} tests failed. Review the errors above.`);
}

console.log('\n📊 Test Coverage Summary:');
console.log('✅ Zombie Type Definitions');
console.log('✅ Stats Balance & Progression');
console.log('✅ Behavioral Properties');
console.log('✅ Evolution System');
console.log('✅ Spawn Weight Distribution');
console.log('✅ Type Lookup & Error Handling');
console.log('✅ Evolution Calculations');
console.log('✅ Game Balance Validation');
console.log('✅ Type Diversity');
console.log('✅ Configuration Completeness');
