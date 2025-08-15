import { pickRandomInArray, randomFloat } from "@common/utils/random";
import { randomPointInsideCircle } from "@common/utils/random";
import { Vec, type Vector } from "@common/utils/vector";
import { Geometry } from "@common/utils/math";
import { RectangleHitbox } from "@common/utils/hitbox";
import { type Game } from "../game";
import { type Player } from "../objects/player";
import { ZombiePlayer } from "./zombiePlayer";
import { ZombieTypes, ZombieSpawnWeights, EvolutionMultipliers, ZombieAIConstants, type ZombieTypeDefinition } from "./zombieTypes";

export class ZombieManager {
    readonly game: Game;
    readonly zombies = new Set<ZombiePlayer>();
    private evolutionLevel = 0;
    private evolutionTimeouts: NodeJS.Timeout[] = [];

    // Dynamic spawning configuration
    private readonly targetZombieCount = { min: 8, max: 12 }; // Target zombie population
    private readonly chunkSize = 50; // Size of spawn chunks
    private readonly spawnRadius = { min: 25, max: 60 }; // Distance from players to spawn
    private readonly despawnRadius = 120; // Distance to despawn zombies

    // LOD Performance Monitoring
    private lastLODReport = 0;
    private readonly lodReportInterval = 10000; // Report LOD stats every 10 seconds
    private readonly spawnInterval = 2000; // Check spawn every 2 seconds
    private readonly maxSpawnPerInterval = 2; // Max zombies to spawn per interval

    // Spawn rate scaling
    readonly baseSpawnRate = 1.0;
    private spawnRateMultiplier = 1.0;
    private lastSpawnCheck = 0;

    // Chunk tracking
    readonly activeChunks = new Map<string, { lastActivity: number, zombieCount: number }>();

    // Statistics tracking
    readonly stats = {
        totalSpawned: 0,
        totalKilled: 0,
        currentActive: 0,
        evolutionEvents: 0,
        lastStatsLog: 0
    };

    // Evolution timing (in milliseconds)
    private readonly evolutionIntervals = [
        3 * 60 * 1000,  // 3 minutes
        6 * 60 * 1000,  // 6 minutes
        9 * 60 * 1000   // 9 minutes
    ];

    constructor(game: Game) {
        this.game = game;

        // Validate LOD configuration at startup
        this.validateLODConfiguration();

        // Add zombies property to game for easy access without using `any`
        const gameWithZombies = this.game as unknown as { zombies: Set<ZombiePlayer>, zombieManager: ZombieManager };
        gameWithZombies.zombies = this.zombies;
        gameWithZombies.zombieManager = this;
    }

    /**
     * Validate LOD configuration parameters at startup
     */
    private validateLODConfiguration(): void {
        const thresholds = ZombieAIConstants.lodDistanceThresholds;
        const intervals = ZombieAIConstants.lodUpdateIntervals;

        // Validate thresholds are strictly increasing
        if (thresholds.high >= thresholds.medium
            || thresholds.medium >= thresholds.low
            || thresholds.low >= thresholds.minimal) {
            throw new Error("LOD distance thresholds must be strictly increasing: high < medium < low < minimal");
        }

        // Validate intervals are positive
        if (intervals.high <= 0 || intervals.medium <= 0 || intervals.low <= 0 || intervals.minimal <= 0) {
            throw new Error("LOD update intervals must be positive values");
        }

        // Log effective configuration
        this.game.log(`LOD Configuration validated:
- Distance Thresholds: High=${thresholds.high}, Medium=${thresholds.medium}, Low=${thresholds.low}, Minimal=${thresholds.minimal}
- Update Intervals: High=${intervals.high}ms, Medium=${intervals.medium}ms, Low=${intervals.low}ms, Minimal=${intervals.minimal}ms`);
    }

    /**
     * Initialize dynamic zombie spawning system
     */
    spawnZombiesForMatch(humanPlayerCount: number): void {
        this.game.log(`Initializing dynamic zombie spawning system for ${humanPlayerCount} human players`);

        // Spawn initial zombies
        const initialSpawnCount = Math.min(this.targetZombieCount.min, 4);
        for (let i = 0; i < initialSpawnCount; i++) {
            this.spawnZombie();
        }

        // Start continuous spawning system
        this.startDynamicSpawning();

        // Schedule evolution events
        this.scheduleEvolutions();
    }

    /**
     * Start the dynamic spawning system
     */
    private startDynamicSpawning(): void {
        // Initialize spawning system (now tick-based, no intervals)
        this.lastSpawnCheck = Date.now();
        this.game.log("Dynamic zombie spawning system started");
    }

    /**
     * Public update method called from game tick loop
     */
    update(): void {
        const now = Date.now();

        // Only run spawning logic at intervals to avoid performance issues
        if (now - this.lastSpawnCheck >= this.spawnInterval) {
            this.updateDynamicSpawning();
            this.lastSpawnCheck = now;
        }

        // Report LOD performance statistics periodically
        if (now - this.lastLODReport >= this.lodReportInterval) {
            this.reportLODStatistics();
            this.lastLODReport = now;
        }
    }

    /**
     * Main dynamic spawning update loop
     */
    private updateDynamicSpawning(): void {
        const humanPlayers = this.getHumanPlayers();
        if (humanPlayers.length === 0) return;

        // Performance monitoring
        const startTime = Date.now();

        // Update spawn rate based on game time
        this.updateSpawnRate();

        // Clean up distant zombies
        this.despawnDistantZombies(humanPlayers);

        // Update chunk activity
        this.updateChunkActivity(humanPlayers);

        // Spawn new zombies if needed
        this.spawnZombiesIfNeeded(humanPlayers);

        // Log performance if update takes too long
        const updateTime = Date.now() - startTime;
        if (updateTime > 50) { // Log if update takes more than 50ms
            this.game.log(`Warning: Zombie update took ${updateTime}ms (zombies: ${this.zombies.size})`);
        }
    }

    /**
     * Spawn a single zombie at a random location
     */
    spawnZombie(position?: Vector): ZombiePlayer | undefined {
        try {
            const zombieType = this.selectZombieType();
            const spawnPosition = position || this.findSpawnPosition();

            if (!spawnPosition) {
                this.game.log("Failed to find spawn position for zombie");
                return undefined;
            }

            const zombie = new ZombiePlayer(this.game, zombieType, spawnPosition);

            // Transaction-like spawning - all or nothing
            const addOperations = [
                () => this.game.livingPlayers.add(zombie),
                () => this.game.connectedPlayers.add(zombie),
                () => this.game.spectatablePlayers.push(zombie),
                () => this.game.newPlayers.push(zombie),
                () => this.zombies.add(zombie),
                () => this.game.grid.addObject(zombie)
            ];

            // Execute all operations
            const completedOperations: Array<() => void> = [];
            for (const operation of addOperations) {
                try {
                    operation();
                    completedOperations.push(operation);
                } catch (error) {
                    // Rollback on failure
                    this.rollbackZombieSpawn(zombie, completedOperations);
                    throw error;
                }
            }

            // Mark for updates only after successful spawn
            zombie.setDirty();
            this.game.aliveCountDirty = true;
            this.game.updateObjects = true;

            // Apply evolution and update stats
            if (this.evolutionLevel > 0) {
                const multiplier = this.calculateEvolutionMultiplier();
                zombie.evolve(multiplier);
            }

            this.stats.totalSpawned++;
            this.stats.currentActive = this.zombies.size;

            this.game.log(`Spawned ${zombieType.name} zombie at ${spawnPosition.x}, ${spawnPosition.y}`);
            return zombie;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.game.log(`Error spawning zombie: ${errorMessage}`);
            return undefined;
        }
    }

    private rollbackZombieSpawn(zombie: ZombiePlayer, completedOperations: Array<() => void>): void {
        // Clean up any partial state
        try {
            this.game.livingPlayers.delete(zombie);
            this.game.connectedPlayers.delete(zombie);
            this.zombies.delete(zombie);

            const specIndex = this.game.spectatablePlayers.indexOf(zombie);
            if (specIndex !== -1) {
                this.game.spectatablePlayers.splice(specIndex, 1);
            }

            const newIndex = this.game.newPlayers.indexOf(zombie);
            if (newIndex !== -1) {
                this.game.newPlayers.splice(newIndex, 1);
            }

            this.game.removeObject(zombie);
        } catch (cleanupError) {
            const errorMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
            this.game.log(`Error during zombie spawn rollback: ${errorMessage}`);
        }
    }

    /**
     * Update spawn rate based on game progression
     */
    private updateSpawnRate(): void {
        const gameTime = this.game.now - this.game.startedTime;
        const minutes = gameTime / (60 * 1000);

        // Increase spawn rate over time (1.0x to 2.5x over 10 minutes)
        this.spawnRateMultiplier = Math.min(1.0 + (minutes * 0.15), 2.5);
    }

    /**
     * Remove zombies that are too far from all players
     */
    private despawnDistantZombies(humanPlayers: Player[]): void {
        const zombiesToRemove: ZombiePlayer[] = [];

        for (const zombie of this.zombies) {
            let tooFar = true;

            for (const player of humanPlayers) {
                const distance = Geometry.distance(zombie.position, player.position);
                if (distance <= this.despawnRadius) {
                    tooFar = false;
                    break;
                }
            }

            if (tooFar) {
                zombiesToRemove.push(zombie);
            }
        }

        for (const zombie of zombiesToRemove) {
            this.removeZombieInternal(zombie);
        }

        if (zombiesToRemove.length > 0) {
            this.game.log(`Despawned ${zombiesToRemove.length} distant zombies`);
        }
    }

    /**
     * Update chunk activity tracking
     */
    private updateChunkActivity(humanPlayers: Player[]): void {
        const currentTime = this.game.now;

        // Mark chunks with players as active
        for (const player of humanPlayers) {
            const chunkKey = this.getChunkKey(player.position);
            this.activeChunks.set(chunkKey, {
                lastActivity: currentTime,
                zombieCount: this.getZombiesInChunk(chunkKey)
            });
        }

        // Clean up old chunks (inactive for more than 30 seconds)
        const expireTime = currentTime - 30000;
        for (const [chunkKey, chunk] of this.activeChunks.entries()) {
            if (chunk.lastActivity < expireTime) {
                this.activeChunks.delete(chunkKey);
            }
        }
    }

    /**
     * Spawn zombies if population is below target
     */
    private spawnZombiesIfNeeded(humanPlayers: Player[]): void {
        const currentZombieCount = this.zombies.size;
        const targetCount = this.calculateTargetZombieCount(humanPlayers.length);

        if (currentZombieCount >= targetCount) return;

        const spawnCount = Math.min(
            targetCount - currentZombieCount,
            Math.floor(this.maxSpawnPerInterval * this.spawnRateMultiplier)
        );

        for (let i = 0; i < spawnCount; i++) {
            this.spawnZombieNearPlayers();
        }

        if (spawnCount > 0) {
            this.game.log(`Spawned ${spawnCount} zombies (${this.zombies.size}/${targetCount})`);
        }
    }

    /**
     * Calculate target zombie count based on player count and game progression
     */
    private calculateTargetZombieCount(humanPlayerCount: number): number {
        const baseTarget = this.targetZombieCount.min + (humanPlayerCount - 1) * 2;
        const scaledTarget = Math.floor(baseTarget * this.spawnRateMultiplier);
        return Math.min(scaledTarget, this.targetZombieCount.max);
    }

    /**
     * Spawn a zombie near human players using chunk-based logic
     */
    private spawnZombieNearPlayers(): ZombiePlayer | null {
        const humanPlayers = this.getHumanPlayers();
        if (humanPlayers.length === 0) return null;

        // Select a random player to spawn near
        const targetPlayer = pickRandomInArray(humanPlayers);
        return this.spawnZombieInChunk(targetPlayer.position);
    }

    /**
     * Spawn a zombie in a chunk around the given position
     */
    private spawnZombieInChunk(centerPosition: Vector): ZombiePlayer | null {
        // Find spawn position within spawn radius but outside minimum distance
        const angle = randomFloat(0, Math.PI * 2);
        const distance = randomFloat(this.spawnRadius.min, this.spawnRadius.max);

        const spawnPosition = Vec.add(centerPosition, Vec.fromPolar(angle, distance));

        // Validate spawn position
        if (!this.isValidSpawnPosition(spawnPosition)) {
            return null;
        }

        return this.spawnZombie(spawnPosition) || null;
    }

    /**
     * Get chunk key for position-based tracking
     */
    private getChunkKey(position: Vector): string {
        const chunkX = Math.floor(position.x / this.chunkSize);
        const chunkY = Math.floor(position.y / this.chunkSize);
        return `${chunkX},${chunkY}`;
    }

    /**
     * Count zombies in a specific chunk
     */
    private getZombiesInChunk(chunkKey: string): number {
        let count = 0;
        for (const zombie of this.zombies) {
            if (this.getChunkKey(zombie.position) === chunkKey) {
                count++;
            }
        }
        return count;
    }

    /**
     * Get all human (non-zombie) players
     */
    private getHumanPlayers(): Player[] {
        const humanPlayers: Player[] = [];
        for (const player of this.game.livingPlayers) {
            if (!player.isZombie) {
                humanPlayers.push(player);
            }
        }
        return humanPlayers;
    }

    /**
     * Select zombie type based on game phase and weights
     */
    private selectZombieType(): ZombieTypeDefinition {
        const gamePhase = this.getGamePhase();
        const weights = ZombieSpawnWeights[gamePhase];

        // Simple weighted selection
        const rand = Math.random();
        let cumulative = 0;

        for (const [typeId, weight] of Object.entries(weights)) {
            cumulative += weight;
            if (rand <= cumulative) {
                return ZombieTypes.fromString(typeId);
            }
        }

        // Fallback to basic zombie
        return ZombieTypes.fromString("basic_zombie");
    }

    /**
     * Determine current game phase based on time elapsed
     */
    private getGamePhase(): keyof typeof ZombieSpawnWeights {
        const elapsed = this.game.now - this.game.startedTime;

        if (elapsed < 5 * 60 * 1000) return "early";   // First 5 minutes
        if (elapsed < 10 * 60 * 1000) return "mid";    // 5-10 minutes
        return "late";                                  // After 10 minutes
    }

    /**
     * Find a safe spawn position for a zombie
     */
    private findSpawnPosition(): Vector | undefined {
        const maxAttempts = 50;

        for (let i = 0; i < maxAttempts; i++) {
            // Try spawning near the edge of the safe zone
            const gasRadius = this.game.gas?.currentRadius ?? this.game.map.width * 0.4;
            const gasPosition = this.game.gas?.currentPosition ?? { x: this.game.map.width / 2, y: this.game.map.height / 2 };
            const spawnRadius = gasRadius * 0.8; // Spawn within 80% of gas radius

            const position = randomPointInsideCircle(gasPosition, spawnRadius);

            // Check if position is valid (not in buildings, obstacles, etc.)
            if (this.isValidSpawnPosition(position)) {
                return position;
            }
        }

        // Fallback: spawn at random position near center
        return {
            x: randomFloat(-100, 100),
            y: randomFloat(-100, 100)
        };
    }

    /**
     * Check if a position is valid for zombie spawning
     */
    private isValidSpawnPosition(position: Vector): boolean {
        // First check gas zone boundary
        if (this.game.gas) {
            const distanceFromGasCenter = Geometry.distance(position, this.game.gas.currentPosition);
            if (distanceFromGasCenter > this.game.gas.currentRadius * 0.9) {
                return false; // Too close to gas edge
            }
        }

        // Check if too close to human players
        for (const player of this.game.livingPlayers) {
            if (player.isZombie) continue;

            const distance = Geometry.distance(position, player.position);
            if (distance < 20) return false;
        }

        // Check for obstacles and buildings
        const nearbyObjects = this.game.grid.intersectsHitbox(
            new RectangleHitbox(Vec.sub(position, { x: 2, y: 2 }), Vec.add(position, { x: 2, y: 2 }))
        );

        for (const obj of nearbyObjects) {
            if (obj.isObstacle && !obj.definition.noCollisions) {
                return false;
            }
        }

        return true;
    }

    /**
     * Schedule zombie evolution events
     */
    private scheduleEvolutions(): void {
        for (const interval of this.evolutionIntervals) {
            const timeout = setTimeout(() => {
                this.evolveAllZombies();
            }, interval);

            this.evolutionTimeouts.push(timeout);
        }
    }

    /**
     * Evolve all zombies to the next level
     */
    private evolveAllZombies(): void {
        this.evolutionLevel++;
        const multiplier = this.calculateEvolutionMultiplier();

        this.game.log(`Zombie evolution level ${this.evolutionLevel} - multiplier: ${multiplier.toFixed(2)}`);

        for (const zombie of this.zombies) {
            if (!zombie.dead) {
                zombie.evolve(multiplier);
            }
        }

        // Spawn additional zombies on evolution
        if (this.evolutionLevel <= 2) {
            const additionalZombies = Math.floor(this.getHumanPlayerCount() * 0.5);
            for (let i = 0; i < additionalZombies; i++) {
                this.spawnZombie();
            }
        }
    }

    /**
     * Calculate evolution multiplier based on current level
     */
    private calculateEvolutionMultiplier(): number {
        const level = Math.min(this.evolutionLevel, EvolutionMultipliers.health.length - 1);
        return EvolutionMultipliers.health[level];
    }

    /**
     * Get count of human (non-zombie) players
     */
    private getHumanPlayerCount(): number {
        let count = 0;
        for (const player of this.game.livingPlayers) {
            if (!player.isZombie) count++;
        }
        return count;
    }

    /**
     * Remove a zombie from tracking (public method for external calls)
     */
    removeZombie(zombie: ZombiePlayer): void {
        this.removeZombieInternal(zombie);

        // Dynamic spawning system will handle replacement automatically
        // No need for immediate respawn logic
    }

    /**
     * Internal zombie removal method
     */
    private removeZombieInternal(zombie: ZombiePlayer): void {
        // Prevent double-removal race condition
        if (!this.zombies.has(zombie)) return;

        this.zombies.delete(zombie);
        this.game.livingPlayers.delete(zombie);
        this.game.connectedPlayers.delete(zombie);

        // Remove from spectatable players array
        const specIndex = this.game.spectatablePlayers.indexOf(zombie);
        if (specIndex !== -1) {
            this.game.spectatablePlayers.splice(specIndex, 1);
        }

        this.game.removeObject(zombie);
        this.game.aliveCountDirty = true;
    }

    /**
     * Get detailed zombie statistics
     */
    getDetailedStats(): {
        totalZombies: number
        aliveZombies: number
        evolutionLevel: number
        zombiesByType: Record<string, number>
    } {
        const zombiesByType: Record<string, number> = {};
        let aliveCount = 0;

        for (const zombie of this.zombies) {
            const type = zombie.zombieType.idString;
            zombiesByType[type] = (zombiesByType[type] || 0) + 1;

            if (!zombie.dead) aliveCount++;
        }

        return {
            totalZombies: this.zombies.size,
            aliveZombies: aliveCount,
            evolutionLevel: this.evolutionLevel,
            zombiesByType
        };
    }

    /**
     * Clean up when game ends
     */
    cleanup(): void {
        // Clean up zombie system (no timers to clear in tick-based system)

        // Clear evolution timeouts
        for (const timeout of this.evolutionTimeouts) {
            clearTimeout(timeout);
        }
        this.evolutionTimeouts = [];

        // Clear chunk tracking
        this.activeChunks.clear();

        // Remove all zombies
        for (const zombie of this.zombies) {
            zombie.disconnect();
        }
        this.zombies.clear();

        this.game.log("Zombie manager cleaned up");
    }

    /**
     * Get zombie statistics for monitoring
     */
    getStats(): typeof this.stats {
        this.stats.currentActive = this.zombies.size;
        return { ...this.stats };
    }

    /**
     * Log zombie statistics periodically
     */
    logStats(): void {
        const now = this.game.now;
        if (now - this.stats.lastStatsLog > 60000) { // Log every minute
            this.stats.lastStatsLog = now;
            const stats = this.getStats();
            this.game.log(`🧟 Zombie Stats: Active=${stats.currentActive}, Spawned=${stats.totalSpawned}, Killed=${stats.totalKilled}, Evolutions=${stats.evolutionEvents}`);
        }
    }

    /**
     * Report LOD (Level of Detail) performance statistics
     */
    private reportLODStatistics(): void {
        if (this.zombies.size === 0) return;

        const lodDistribution = this.getLODDistribution();
        const totalZombies = this.zombies.size;

        this.game.log(`🎯 LOD Stats: Total=${totalZombies}, High=${lodDistribution.high}, Medium=${lodDistribution.medium}, Low=${lodDistribution.low}, Minimal=${lodDistribution.minimal}`);

        // Warn if too many zombies are in high detail mode
        if (lodDistribution.high > 15) {
            this.game.warn(`⚠️ High LOD zombie count (${lodDistribution.high}) may impact performance`);
        }
    }

    /**
     * Get current LOD distribution across all zombies
     */
    getLODDistribution(): { high: number, medium: number, low: number, minimal: number } {
        const distribution = { high: 0, medium: 0, low: 0, minimal: 0 };

        for (const zombie of this.zombies) {
            const lodLevel = zombie.getLODLevel();
            switch (lodLevel) {
                case 0: distribution.high++; break;
                case 1: distribution.medium++; break;
                case 2: distribution.low++; break;
                case 3: distribution.minimal++; break;
            }
        }

        return distribution;
    }

    /**
     * Get performance metrics for LOD system
     */
    getLODPerformanceMetrics(): {
        totalZombies: number
        lodDistribution: { high: number, medium: number, low: number, minimal: number }
        averageDistance: number
        performanceScore: number
    } {
        const totalZombies = this.zombies.size;
        const lodDistribution = this.getLODDistribution();

        let totalDistance = 0;
        let zombieCount = 0;

        for (const zombie of this.zombies) {
            const distance = zombie.getDistanceToNearestPlayer();
            if (distance !== Infinity) {
                totalDistance += distance;
                zombieCount++;
            }
        }

        const averageDistance = zombieCount > 0 ? totalDistance / zombieCount : 0;

        // Calculate performance score (higher is better)
        // Fewer high-detail zombies = better performance
        const performanceScore = Math.max(0, 100 - (lodDistribution.high * 3) - (lodDistribution.medium * 1.5));

        return {
            totalZombies,
            lodDistribution,
            averageDistance,
            performanceScore
        };
    }
}
