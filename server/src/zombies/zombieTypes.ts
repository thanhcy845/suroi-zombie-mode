export interface ZombieTypeDefinition {
    readonly idString: string;
    readonly name: string;
    readonly health: number;
    readonly speed: number;
    readonly damage: number;
    readonly attackRange: number;
    readonly detectionRange: number;
    readonly skin: string;
    readonly evolutionLevel: number;
    readonly aggressionLevel: number; // 0-1, affects AI behavior
    readonly packBehavior: boolean; // Whether this zombie type groups with others
}

// Simple zombie type registry
const zombieTypeDefinitions: ZombieTypeDefinition[] = [
    {
        idString: "basic_zombie",
        name: "Basic Zombie",
        health: 120,
        speed: 0.45, // Reduced from 0.8 for better balance
        damage: 25,
        attackRange: 2.5,
        detectionRange: 15,
        skin: "hazel_jumpsuit", // Using existing skin as placeholder
        evolutionLevel: 0,
        aggressionLevel: 0.6,
        packBehavior: true
    },
    {
        idString: "fast_runner",
        name: "Fast Runner",
        health: 80,
        speed: 0.65, // Reduced from 1.3 for better balance
        damage: 20,
        attackRange: 2,
        detectionRange: 20,
        skin: "forest_camo", // Using existing skin as placeholder
        evolutionLevel: 0,
        aggressionLevel: 0.8,
        packBehavior: false
    },
    {
        idString: "tank_zombie",
        name: "Tank Zombie",
        health: 200,
        speed: 0.35, // Reduced from 0.6 for better balance
        damage: 40,
        attackRange: 3,
        detectionRange: 12,
        skin: "desert_camo", // Using existing skin as placeholder
        evolutionLevel: 0,
        aggressionLevel: 0.4,
        packBehavior: true
    }
];

// Simple zombie type registry with lookup methods
export const ZombieTypes = {
    definitions: zombieTypeDefinitions,

    fromString(idString: string): ZombieTypeDefinition {
        const def = zombieTypeDefinitions.find(d => d.idString === idString);
        if (!def) {
            throw new Error(`Unknown zombie type: ${idString}`);
        }
        return def;
    },

    fromStringSafe(idString: string): ZombieTypeDefinition | undefined {
        return zombieTypeDefinitions.find(d => d.idString === idString);
    },

    selectRandomType(phase: keyof typeof ZombieSpawnWeights): ZombieTypeDefinition {
        const weights = ZombieSpawnWeights[phase];
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        for (const [typeId, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                return this.fromString(typeId);
            }
        }

        // Fallback to basic zombie
        return this.fromString('basic_zombie');
    }
};

export type ZombieTypeString = "basic_zombie" | "fast_runner" | "tank_zombie";

// Zombie spawn weights for different game phases
export const ZombieSpawnWeights = {
    early: {
        basic_zombie: 0.6,
        fast_runner: 0.3,
        tank_zombie: 0.1
    },
    mid: {
        basic_zombie: 0.4,
        fast_runner: 0.4,
        tank_zombie: 0.2
    },
    late: {
        basic_zombie: 0.3,
        fast_runner: 0.3,
        tank_zombie: 0.4
    }
} as const;

// Evolution multipliers per level
export const EvolutionMultipliers = {
    health: [1.0, 1.3, 1.6, 2.0],
    speed: [1.0, 1.2, 1.4, 1.7],
    damage: [1.0, 1.4, 1.8, 2.3],
    detection: [1.0, 1.2, 1.4, 1.6]
} as const;

// Zombie AI behavior constants
export const ZombieAIConstants = {
    pathfindingUpdateInterval: 500, // ms
    targetSwitchCooldown: 2000, // ms
    wanderRadius: 20,
    stuckThreshold: 1.0, // units
    stuckTimeout: 3000, // ms
    groupRadius: 10, // radius for pack behavior
    fleeHealthThreshold: 0.2, // flee when health below 20%
    aggroTimeout: 10000, // ms to stay aggressive after taking damage

    // Collision avoidance constants
    separationDistance: 3.5, // minimum distance to maintain from players
    avoidanceForce: 0.8, // strength of avoidance behavior
    circlingRadius: 4.0, // radius for circling behavior around players
    circlingSpeed: 0.3, // speed multiplier when circling
    personalSpace: 2.0, // minimum distance between zombies
    maxAvoidanceAngle: Math.PI / 3 // maximum angle to deviate for avoidance
} as const;
