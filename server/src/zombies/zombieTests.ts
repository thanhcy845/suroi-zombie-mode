/**
 * Zombie System Test Suite
 *
 * This file contains comprehensive tests for the zombie mode enhancement.
 * Run these tests to ensure the zombie system is working correctly.
 */

import { Game } from "../game";
import { ZombiePlayer } from "./zombiePlayer";
import { ZombieTypes } from "./zombieTypes";
import { ZombieAIState } from "./zombieAI";
import { TeamMode } from "@common/constants";

export class ZombieTestSuite {
    private readonly game: Game;
    private readonly testResults: Array<{ name: string, passed: boolean, error?: string }> = [];

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Run all zombie system tests
     */
    async runAllTests(): Promise<void> {
        console.log("🧟 Starting Zombie System Test Suite...");

        await this.testZombieSpawning();
        await this.testZombieTypes();
        await this.testZombieAI();
        await this.testZombieEvolution();
        await this.testZombieManager();
        await this.testZombieCombat();
        await this.testZombiePathfinding();
        await this.testGameIntegration();
        await this.testPerformance();

        this.printResults();
    }

    /**
     * Test zombie spawning functionality
     */
    private async testZombieSpawning(): Promise<void> {
        try {
            const initialZombieCount = this.game.zombies.size;

            // Test single zombie spawn
            const zombie = this.game.zombieManager.spawnZombie();

            this.assert(zombie !== undefined, "Zombie should spawn successfully");
            this.assert(this.game.zombies.size === initialZombieCount + 1, "Zombie count should increase");
            this.assert(!!zombie?.isZombie, "Spawned entity should be marked as zombie");
            this.assert(!zombie?.dead, "Newly spawned zombie should be alive");

            this.addTestResult("Zombie Spawning", true);
        } catch (error) {
            this.addTestResult("Zombie Spawning", false, (error as Error).message);
        }
    }

    /**
     * Test zombie type definitions and properties
     */
    private async testZombieTypes(): Promise<void> {
        try {
            const basicZombie = ZombieTypes.fromString("basic_zombie");
            const fastRunner = ZombieTypes.fromString("fast_runner");
            const tankZombie = ZombieTypes.fromString("tank_zombie");

            this.assert(basicZombie !== undefined, "Basic zombie type should exist");
            this.assert(fastRunner !== undefined, "Fast runner type should exist");
            this.assert(tankZombie !== undefined, "Tank zombie type should exist");

            // Test type properties
            this.assert(fastRunner.speed > basicZombie.speed, "Fast runner should be faster than basic zombie");
            this.assert(tankZombie.health > basicZombie.health, "Tank zombie should have more health");
            this.assert(tankZombie.damage > basicZombie.damage, "Tank zombie should deal more damage");

            this.addTestResult("Zombie Types", true);
        } catch (error) {
            this.addTestResult("Zombie Types", false, (error as Error).message);
        }
    }

    /**
     * Test zombie AI behavior system
     */
    private async testZombieAI(): Promise<void> {
        try {
            const zombie = new ZombiePlayer(
                this.game,
                ZombieTypes.fromString("basic_zombie"),
                { x: 0, y: 0 }
            );

            this.assert(zombie.ai !== undefined, "Zombie should have AI system");
            this.assert(zombie.ai.getCurrentState().currentState === ZombieAIState.Idle, "Initial AI state should be Idle");

            // Test AI state transitions
            zombie.ai.update();
            const aiState = zombie.ai.getCurrentState();

            this.assert(aiState.movement !== undefined, "AI should provide movement commands");
            this.assert(typeof aiState.shouldAttack === "boolean", "AI should provide attack decision");

            this.addTestResult("Zombie AI", true);
        } catch (error) {
            this.addTestResult("Zombie AI", false, (error as Error).message);
        }
    }

    /**
     * Test zombie evolution system
     */
    private async testZombieEvolution(): Promise<void> {
        try {
            const zombie = new ZombiePlayer(
                this.game,
                ZombieTypes.fromString("basic_zombie"),
                { x: 0, y: 0 }
            );

            const initialHealth = zombie.maxHealth;
            // const initialMultiplier = zombie.getEvolutionMultiplier();

            // Test evolution
            zombie.evolve(1.5);

            this.assert(zombie.getEvolutionMultiplier() === 1.5, "Evolution multiplier should update");
            this.assert(zombie.maxHealth > initialHealth, "Max health should increase after evolution");
            this.assert(zombie.getZombieDamage() > zombie.zombieType.damage, "Damage should increase after evolution");

            this.addTestResult("Zombie Evolution", true);
        } catch (error) {
            this.addTestResult("Zombie Evolution", false, (error as Error).message);
        }
    }

    /**
     * Test zombie manager functionality
     */
    private async testZombieManager(): Promise<void> {
        try {
            const manager = this.game.zombieManager;
            const initialStats = manager.getDetailedStats();

            // Test batch spawning
            manager.spawnZombiesForMatch(2); // Should spawn 6 zombies (3 per player)

            const newStats = manager.getDetailedStats();
            this.assert(newStats.totalZombies >= initialStats.totalZombies + 6, "Should spawn correct number of zombies");

            // Test stats tracking
            this.assert(typeof newStats.evolutionLevel === "number", "Should track evolution level");
            this.assert(typeof newStats.aliveZombies === "number", "Should track alive zombies");
            this.assert(typeof newStats.zombiesByType === "object", "Should track zombies by type");

            this.addTestResult("Zombie Manager", true);
        } catch (error) {
            this.addTestResult("Zombie Manager", false, (error as Error).message);
        }
    }

    /**
     * Test zombie combat mechanics
     */
    private async testZombieCombat(): Promise<void> {
        try {
            const zombie = new ZombiePlayer(
                this.game,
                ZombieTypes.fromString("basic_zombie"),
                { x: 0, y: 0 }
            );

            const initialDamage = zombie.getZombieDamage();
            this.assert(initialDamage > 0, "Zombie should have positive damage value");

            const attackRange = zombie.getAttackRange();
            this.assert(attackRange > 0, "Zombie should have positive attack range");

            const detectionRange = zombie.getDetectionRange();
            this.assert(detectionRange > attackRange, "Detection range should be greater than attack range");

            this.addTestResult("Zombie Combat", true);
        } catch (error) {
            this.addTestResult("Zombie Combat", false, (error as Error).message);
        }
    }

    /**
     * Test zombie pathfinding and movement
     */
    private async testZombiePathfinding(): Promise<void> {
        try {
            const zombie = new ZombiePlayer(
                this.game,
                ZombieTypes.fromString("fast_runner"),
                { x: 0, y: 0 }
            );

            // Test AI movement generation
            zombie.ai.update();
            const aiState = zombie.ai.getCurrentState();

            this.assert(aiState.movement !== undefined, "AI should generate movement commands");
            // Validate movement fields exist (no-op references)
            void aiState.movement.up;
            void aiState.movement.down;
            void aiState.movement.left;
            void aiState.movement.right;

            // In idle state, zombie might not move, but movement object should exist
            const movement = aiState.movement as { up: boolean, down: boolean, left: boolean, right: boolean };
            this.assert(typeof movement.up === "boolean", "Movement should have up direction");
            this.assert(typeof movement.down === "boolean", "Movement should have down direction");
            this.assert(typeof movement.left === "boolean", "Movement should have left direction");
            this.assert(typeof movement.right === "boolean", "Movement should have right direction");

            this.addTestResult("Zombie Pathfinding", true);
        } catch (error) {
            this.addTestResult("Zombie Pathfinding", false, (error as Error).message);
        }
    }

    /**
     * Test zombie integration with game systems
     */
    private async testGameIntegration(): Promise<void> {
        try {
            // Test zombie mode activation
            // const humanPlayerCount = this.game.getHumanPlayerCount?.();

            // Test zombie spawning in solo mode
            if (this.game.teamMode === TeamMode.Solo) { // Solo mode
                this.game.zombieManager.spawnZombiesForMatch(1);
                this.assert(this.game.zombies.size > 0, "Zombies should spawn in solo mode");
            }

            // Test zombie cleanup
            const zombieCount = this.game.zombies.size;
            this.game.zombieManager.cleanup();
            this.assert(this.game.zombies.size === 0 || this.game.zombies.size < zombieCount, "Zombies should be cleaned up");

            this.addTestResult("Game Integration", true);
        } catch (error) {
            this.addTestResult("Game Integration", false, (error as Error).message);
        }
    }

    /**
     * Performance test for zombie system
     */
    private async testPerformance(): Promise<void> {
        try {
            const startTime = Date.now();

            // Spawn many zombies and test update performance
            for (let i = 0; i < 50; i++) {
                this.game.zombieManager.spawnZombie();
            }

            // Update all zombies
            for (const zombie of this.game.zombies) {
                zombie.update();
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            this.assert(duration < 1000, "50 zombie updates should complete within 1 second");

            // Cleanup
            this.game.zombieManager.cleanup();

            this.addTestResult("Performance", true);
        } catch (error) {
            this.addTestResult("Performance", false, (error as Error).message);
        }
    }

    private assert(condition: boolean, message: string): void {
        if (!condition) {
            throw new Error(message);
        }
    }

    private addTestResult(name: string, passed: boolean, error?: string): void {
        this.testResults.push({ name, passed, error });
    }

    private printResults(): void {
        console.log("\n🧟 Zombie System Test Results:");
        console.log("================================");

        let passedCount = 0;
        for (const result of this.testResults) {
            const status = result.passed ? "✅ PASS" : "❌ FAIL";
            console.log(`${status} ${result.name}`);

            if (!result.passed && result.error) {
                console.log(`   Error: ${result.error}`);
            }

            if (result.passed) passedCount++;
        }

        console.log("================================");
        console.log(`Results: ${passedCount}/${this.testResults.length} tests passed`);

        if (passedCount === this.testResults.length) {
            console.log("🎉 All zombie system tests passed!");
        } else {
            console.log("⚠️  Some tests failed. Check the errors above.");
        }
    }
}

/**
 * Quick test function for development
 */
export function runQuickZombieTest(game: Game): void {
    console.log("🧟 Running quick zombie test...");

    try {
        // Test basic spawning
        const zombie = game.zombieManager.spawnZombie();
        if (!zombie) {
            console.log("❌ Failed to spawn zombie");
            return;
        }

        // Test AI
        zombie.ai.update();
        const aiState = zombie.ai.getCurrentState();

        console.log("✅ Zombie spawned successfully");
        console.log(`✅ AI state: ${aiState.currentState}`);
        console.log(`✅ Zombie health: ${zombie.health}/${zombie.maxHealth}`);
        console.log(`✅ Zombie type: ${zombie.zombieType.name}`);

        // Cleanup
        zombie.disconnect();

        console.log("🎉 Quick zombie test completed successfully!");
    } catch (error) {
        console.log(`❌ Quick zombie test failed: ${(error as Error).message}`);
    }
}
