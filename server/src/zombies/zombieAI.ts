import { Geometry } from "@common/utils/math";
import { pickRandomInArray, randomFloat } from "@common/utils/random";
import { Vec, type Vector } from "@common/utils/vector";
import { RectangleHitbox } from "@common/utils/hitbox";
import { type Player } from "../objects/player";
import { type ZombiePlayer } from "./zombiePlayer";
import { ZombieAIConstants } from "./zombieTypes";

export enum ZombieAIState {
    Idle,
    Wandering,
    Hunting,
    Attacking,
    Fleeing,
    Grouping
}

export interface AIMovement {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
}

export interface AIState {
    movement: AIMovement
    target?: Vector
    shouldAttack: boolean
    currentState: ZombieAIState
}

export class ZombieAI {
    private _currentState = ZombieAIState.Idle;
    private _target?: Player;
    private _targetPosition?: Vector;
    private _intermediateTarget?: Vector;
    private _lastPathUpdate = 0;
    private _lastTargetSwitch = 0;
    private _wanderTarget?: Vector;
    private _stuckPosition?: Vector;
    private _stuckTime = 0;
    private _circlingStartTime = 0;
    private readonly _circlingTimeout = 5000; // 5 seconds max circling
    private _aggroUntil = 0;
    private _lastPosition: Vector;

    // LOD (Level of Detail) System Properties
    private _lodLevel = 0; // 0=High, 1=Medium, 2=Low, 3=Minimal
    private _lastLODUpdate = 0;
    private readonly _lodUpdateInterval = 1000; // Update LOD every 1 second
    private _distanceToNearestPlayer = Infinity;

    constructor(private readonly zombie: ZombiePlayer) {
        this._lastPosition = Vec.clone(zombie.position);
    }

    update(): void {
        const now = this.zombie.game.now;

        // Update LOD level periodically
        if (now - this._lastLODUpdate > this._lodUpdateInterval) {
            this.updateLODLevel();
            this._lastLODUpdate = now;
        }

        // Check if stuck (always run for safety)
        this.checkIfStuck();

        // Update pathfinding based on LOD level
        const pathfindingInterval = this.getPathfindingInterval();
        if (now - this._lastPathUpdate > pathfindingInterval) {
            this.updatePathfinding();
            this._lastPathUpdate = now;
        }

        // Update AI state (frequency based on LOD)
        if (this.shouldUpdateAIState()) {
            this.updateState();
        }

        // Update last position for stuck detection
        this._lastPosition = Vec.clone(this.zombie.position);
    }

    private updateState(): void {
        const nearestPlayer = this.findNearestPlayer();
        const isAggro = this.zombie.game.now < this._aggroUntil;

        // State transitions
        switch (this._currentState) {
            case ZombieAIState.Idle:
                if (nearestPlayer && this.canDetectPlayer(nearestPlayer)) {
                    this.setState(ZombieAIState.Hunting, nearestPlayer);
                } else if (this.zombie.zombieType.packBehavior) {
                    this.setState(ZombieAIState.Grouping);
                } else {
                    this.setState(ZombieAIState.Wandering);
                }
                break;

            case ZombieAIState.Wandering:
                if (nearestPlayer && this.canDetectPlayer(nearestPlayer)) {
                    this.setState(ZombieAIState.Hunting, nearestPlayer);
                } else if (!this._wanderTarget || this.reachedTarget(this._wanderTarget)) {
                    this.setWanderTarget();
                }
                break;

            case ZombieAIState.Hunting:
                if (!nearestPlayer || !this.canDetectPlayer(nearestPlayer)) {
                    this.setState(isAggro ? ZombieAIState.Wandering : ZombieAIState.Idle);
                } else if (this.isInAttackRange(nearestPlayer)) {
                    this.setState(ZombieAIState.Attacking, nearestPlayer);
                } else {
                    this._target = nearestPlayer;
                    this._targetPosition = nearestPlayer.position;
                }
                break;

            case ZombieAIState.Attacking:
                if (!nearestPlayer || !this.isInAttackRange(nearestPlayer)) {
                    this.setState(ZombieAIState.Hunting, nearestPlayer);
                } else {
                    this._target = nearestPlayer;
                    // Use tactical positioning instead of direct position targeting
                    this._targetPosition = this.getTacticalAttackPosition(nearestPlayer);
                }
                break;

            case ZombieAIState.Fleeing:
                if (this.zombie.health / this.zombie.maxHealth > ZombieAIConstants.fleeHealthThreshold) {
                    this.setState(ZombieAIState.Idle);
                }
                break;

            case ZombieAIState.Grouping:
                if (nearestPlayer && this.canDetectPlayer(nearestPlayer)) {
                    this.setState(ZombieAIState.Hunting, nearestPlayer);
                } else {
                    this.findGroupTarget();
                }
                break;
        }
    }

    private setState(newState: ZombieAIState, target?: Player): void {
        this._currentState = newState;
        this._target = target;

        if (target) {
            this._targetPosition = target.position;
            this._lastTargetSwitch = this.zombie.game.now;
        }
    }

    private findNearestPlayer(): Player | undefined {
        // Add comprehensive null/undefined checks
        if (!this.zombie || !this.zombie.game || !this.zombie.game.livingPlayers || !this.zombie.position) {
            return undefined;
        }

        let nearest: Player | undefined;
        let minDistance = Infinity;

        for (const player of this.zombie.game.livingPlayers) {
            // Enhanced validation checks
            if (!player || player.isZombie || player === this.zombie || player.dead || !player.position) {
                continue;
            }

            try {
                const distance = Geometry.distance(this.zombie.position, player.position);

                // Validate distance calculation result
                if (isNaN(distance) || !isFinite(distance)) {
                    continue;
                }

                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = player;
                }
            } catch (error) {
                // Log error but continue processing other players
                console.warn(`Error calculating distance to player ${player.id}:`, error);
                continue;
            }
        }

        return nearest;
    }

    private canDetectPlayer(player: Player): boolean {
        // Comprehensive validation checks
        if (!player || !player.position || !this.zombie || !this.zombie.position || player.dead || player.isZombie) {
            return false;
        }

        // Validate zombie detection capabilities
        if (!this.zombie.getDetectionRange || typeof this.zombie.getDetectionRange !== 'function') {
            return false;
        }

        try {
            const distance = Geometry.distance(this.zombie.position, player.position);

            // Validate distance calculation
            if (isNaN(distance) || !isFinite(distance)) {
                return false;
            }

            const detectionRange = this.zombie.getDetectionRange();

            // Validate detection range
            if (isNaN(detectionRange) || !isFinite(detectionRange) || detectionRange <= 0) {
                return false;
            }

            return distance <= detectionRange;
        } catch (error) {
            console.warn(`Error in canDetectPlayer for player ${player.id}:`, error);
            return false;
        }
    }

    private isInAttackRange(player: Player): boolean {
        const distance = Geometry.distance(this.zombie.position, player.position);
        return distance <= this.zombie.getAttackRange();
    }

    private setWanderTarget(): void {
        const angle = randomFloat(0, Math.PI * 2);
        const distance = randomFloat(5, ZombieAIConstants.wanderRadius);

        this._wanderTarget = Vec.add(
            this.zombie.position,
            Vec.fromPolar(angle, distance)
        );
        this._targetPosition = this._wanderTarget;
    }

    private findGroupTarget(): void {
        // Find nearby zombies to group with
        const nearbyZombies = Array.from(this.zombie.game.zombies || [])
            .filter(z => z !== this.zombie && !z.dead)
            .filter(z => Geometry.distance(this.zombie.position, z.position) <= ZombieAIConstants.groupRadius);

        if (nearbyZombies.length > 0) {
            const target = pickRandomInArray(nearbyZombies);
            this._targetPosition = target.position;
        } else {
            this.setWanderTarget();
        }
    }

    private reachedTarget(target: Vector): boolean {
        // Validate inputs
        if (!target || !this.zombie || !this.zombie.position) {
            return false;
        }

        // Validate target coordinates
        if (typeof target.x !== 'number' || typeof target.y !== 'number' ||
            isNaN(target.x) || isNaN(target.y) || !isFinite(target.x) || !isFinite(target.y)) {
            return false;
        }

        try {
            const distance = Geometry.distance(this.zombie.position, target);

            // Validate distance calculation
            if (isNaN(distance) || !isFinite(distance)) {
                return false;
            }

            // Use configurable threshold from constants, with fallback
            const threshold = ZombieAIConstants.stuckThreshold || 1.0;
            return distance < threshold;
        } catch (error) {
            console.warn(`Error in reachedTarget calculation:`, error);
            return false;
        }
    }

    private checkIfStuck(): void {
        // Validate zombie and game state
        if (!this.zombie || !this.zombie.position || !this.zombie.game || !this.zombie.game.now || !this._lastPosition) {
            return;
        }

        try {
            const currentPos = this.zombie.position;
            const now = this.zombie.game.now;

            // Validate positions
            if (typeof currentPos.x !== 'number' || typeof currentPos.y !== 'number' ||
                isNaN(currentPos.x) || isNaN(currentPos.y) ||
                typeof this._lastPosition.x !== 'number' || typeof this._lastPosition.y !== 'number' ||
                isNaN(this._lastPosition.x) || isNaN(this._lastPosition.y)) {
                return;
            }

            const movementDistance = Geometry.distance(currentPos, this._lastPosition);

            // Validate distance calculation
            if (isNaN(movementDistance) || !isFinite(movementDistance)) {
                return;
            }

            const stuckThreshold = ZombieAIConstants.stuckThreshold || 1.0;
            const stuckTimeout = ZombieAIConstants.stuckTimeout || 3000;

            if (movementDistance < stuckThreshold) {
                if (!this._stuckPosition) {
                    this._stuckPosition = Vec.clone(currentPos);
                    this._stuckTime = now;
                } else if (now - this._stuckTime > stuckTimeout) {
                    // Force unstuck behavior with multiple strategies
                    this.performUnstuckBehavior();
                    this._stuckPosition = undefined;
                    this._stuckTime = 0;
                }
            } else {
                // Reset stuck detection when zombie is moving
                this._stuckPosition = undefined;
                this._stuckTime = 0;
            }
        } catch (error) {
            console.warn(`Error in checkIfStuck for zombie ${this.zombie.id}:`, error);
            // Reset stuck state on error to prevent permanent stuck condition
            this._stuckPosition = undefined;
            this._stuckTime = 0;
        }
    }

    /**
     * Perform multiple unstuck strategies when zombie is detected as stuck
     */
    private performUnstuckBehavior(): void {
        try {
            // Strategy 1: Set new wander target
            this.setWanderTarget();

            // Strategy 2: If still in same position, try different approach
            if (this._stuckPosition && this.zombie.position &&
                Geometry.distance(this.zombie.position, this._stuckPosition) < 0.5) {

                // Force state change to break current behavior
                this.setState(ZombieAIState.Wandering);

                // Set target further away
                const angle = randomFloat(0, Math.PI * 2);
                const distance = randomFloat(10, ZombieAIConstants.wanderRadius * 2);

                this._targetPosition = Vec.add(
                    this.zombie.position,
                    Vec.fromPolar(angle, distance)
                );
            }
        } catch (error) {
            console.warn(`Error in performUnstuckBehavior:`, error);
        }
    }

    private updatePathfinding(): void {
        if (!this._targetPosition) return;

        // Use the advanced pathfinding with obstacle avoidance
        const pathTarget = this.findPathToTarget(this._targetPosition);
        if (pathTarget) {
            this._intermediateTarget = pathTarget;
        }

        // Call pack coordination for pack zombies
        if (this.zombie.zombieType.packBehavior) {
            this.coordinateWithPack();
        }

        const direction = Vec.sub(this._targetPosition, this.zombie.position);
        const distance = Vec.len(direction);

        if (distance < 0.1) return;

        const normalized = Vec.scale(direction, 1 / distance);

        // Add noise but don't modify original target
        const noise = Vec.fromPolar(randomFloat(0, Math.PI * 2), 0.1);
        const noisyDirection = Vec.add(normalized, noise);

        // Create intermediate waypoint instead of modifying target (fallback if no pathTarget)
        if (!this._intermediateTarget) {
            this._intermediateTarget = Vec.add(this.zombie.position, Vec.scale(noisyDirection, 2));
        }
    }

    getCurrentState(): AIState {
        const movement: AIMovement = { up: false, down: false, left: false, right: false };

        if (this._targetPosition) {
            // Calculate base direction to target
            let direction = Vec.sub(this._targetPosition, this.zombie.position);

            // Apply collision avoidance and separation logic
            direction = this.applyCollisionAvoidance(direction);

            const threshold = 0.1;

            if (direction.x > threshold) movement.right = true;
            if (direction.x < -threshold) movement.left = true;
            if (direction.y > threshold) movement.down = true;
            if (direction.y < -threshold) movement.up = true;
        }

        return {
            movement,
            target: this._targetPosition,
            shouldAttack: this._currentState === ZombieAIState.Attacking && !!this._target,
            currentState: this._currentState
        };
    }

    onTakeDamage(source: Player): void {
        // Become aggressive for a period
        this._aggroUntil = this.zombie.game.now + ZombieAIConstants.aggroTimeout;

        // Switch target to attacker if not already targeting
        if (!this._target || this.zombie.game.now - this._lastTargetSwitch > ZombieAIConstants.targetSwitchCooldown) {
            this.setState(ZombieAIState.Hunting, source);
        }

        // Check if should flee
        if (this.zombie.health / this.zombie.maxHealth < ZombieAIConstants.fleeHealthThreshold) {
            this.setState(ZombieAIState.Fleeing);
            // Set flee target away from source
            const fleeDirection = Vec.sub(this.zombie.position, source.position);
            this._targetPosition = Vec.add(this.zombie.position, Vec.scale(Vec.normalize(fleeDirection), 20));
        }
    }

    onEvolution(multiplier: number): void {
        // Become more aggressive after evolution
        this._aggroUntil = this.zombie.game.now + (ZombieAIConstants.aggroTimeout * multiplier);
    }

    /**
     * Apply collision avoidance and separation logic to movement direction
     */
    private applyCollisionAvoidance(baseDirection: Vector): Vector {
        let finalDirection = Vec.clone(baseDirection);

        // Find nearby players and zombies
        const nearbyEntities = this.getNearbyEntities();

        // Apply separation from players (avoid getting stuck)
        for (const player of nearbyEntities.players) {
            const distance = Geometry.distance(this.zombie.position, player.position);

            if (distance < ZombieAIConstants.separationDistance) {
                // Too close to player - apply separation force
                const separationVector = Vec.sub(this.zombie.position, player.position);
                const separationForce = ZombieAIConstants.avoidanceForce * (ZombieAIConstants.separationDistance - distance) / ZombieAIConstants.separationDistance;

                if (Vec.len(separationVector) > 0) {
                    const normalizedSeparation = Vec.normalize(separationVector);
                    finalDirection = Vec.add(finalDirection, Vec.scale(normalizedSeparation, separationForce));
                }

                // If very close, implement circling behavior with timeout
                if (distance < ZombieAIConstants.circlingRadius && this._currentState === ZombieAIState.Attacking) {
                    const now = this.zombie.game.now;

                    // Start circling timer if not already circling
                    if (this._circlingStartTime === 0) {
                        this._circlingStartTime = now;
                    }

                    // Escape circling after timeout
                    if (now - this._circlingStartTime > this._circlingTimeout) {
                        this._circlingStartTime = 0;
                        // Force different behavior - maybe flee or switch target
                        this.setWanderTarget();
                    } else {
                        const circleDirection = this.getCirclingDirection(player.position);
                        finalDirection = Vec.lerp(finalDirection, circleDirection, ZombieAIConstants.circlingSpeed);
                    }
                } else {
                    this._circlingStartTime = 0; // Reset circling timer
                }
            }
        }

        // Apply separation from other zombies (prevent clustering)
        for (const zombie of nearbyEntities.zombies) {
            const distance = Geometry.distance(this.zombie.position, zombie.position);

            if (distance < ZombieAIConstants.personalSpace) {
                const separationVector = Vec.sub(this.zombie.position, zombie.position);
                const separationForce = 0.5 * (ZombieAIConstants.personalSpace - distance) / ZombieAIConstants.personalSpace;

                if (Vec.len(separationVector) > 0) {
                    const normalizedSeparation = Vec.normalize(separationVector);
                    finalDirection = Vec.add(finalDirection, Vec.scale(normalizedSeparation, separationForce));
                }
            }
        }

        // Normalize the final direction to prevent excessive speed
        if (Vec.len(finalDirection) > 1) {
            finalDirection = Vec.normalize(finalDirection);
        }

        return finalDirection;
    }

    /**
     * Get circling direction around a target to avoid getting stuck
     */
    private getCirclingDirection(targetPosition: Vector): Vector {
        const toTarget = Vec.sub(targetPosition, this.zombie.position);
        const distance = Vec.len(toTarget);

        if (distance === 0) return Vec(1, 0);

        // Create a perpendicular vector for circling
        const perpendicular = Vec(-toTarget.y, toTarget.x);
        const normalizedPerp = Vec.normalize(perpendicular);

        // Combine circling with slight approach
        const approachForce = 0.3;
        const circleForce = 0.7;

        const approachDirection = Vec.normalize(toTarget);
        const finalDirection = Vec.add(
            Vec.scale(approachDirection, approachForce),
            Vec.scale(normalizedPerp, circleForce)
        );

        return Vec.normalize(finalDirection);
    }

    /**
     * Get nearby entities for collision avoidance
     */
    private getNearbyEntities(): { players: Player[], zombies: ZombiePlayer[] } {
        const players: Player[] = [];
        const zombies: ZombiePlayer[] = [];
        const checkRadius = Math.max(ZombieAIConstants.separationDistance, ZombieAIConstants.personalSpace) * 1.5;

        // Find nearby players
        for (const player of this.zombie.game.livingPlayers) {
            if (player.isZombie || player === this.zombie) continue;

            const distance = Geometry.distance(this.zombie.position, player.position);
            if (distance <= checkRadius) {
                players.push(player);
            }
        }

        // Find nearby zombies
        for (const zombie of this.zombie.game.zombies || []) {
            if (zombie === this.zombie || zombie.dead) continue;

            const distance = Geometry.distance(this.zombie.position, zombie.position);
            if (distance <= checkRadius) {
                zombies.push(zombie);
            }
        }

        return { players, zombies };
    }

    /**
     * Get tactical attack position to avoid getting stuck on players
     */
    private getTacticalAttackPosition(target: Player): Vector {
        const distance = Geometry.distance(this.zombie.position, target.position);

        // If too close, use circling behavior
        if (distance < ZombieAIConstants.separationDistance) {
            return this.getCirclingDirection(target.position);
        }

        // Otherwise, approach to optimal attack distance
        const optimalDistance = this.zombie.getAttackRange() * 0.8; // Stay slightly within attack range
        const direction = Vec.sub(target.position, this.zombie.position);

        if (Vec.len(direction) === 0) {
            return Vec.add(this.zombie.position, Vec(1, 0)); // Default direction if positions are identical
        }

        const normalizedDirection = Vec.normalize(direction);
        return Vec.add(target.position, Vec.scale(normalizedDirection, -optimalDistance));
    }

    /**
     * Advanced pathfinding with obstacle avoidance
     */
    private findPathToTarget(target: Vector): Vector | undefined {
        const direction = Vec.sub(target, this.zombie.position);
        const distance = Vec.len(direction);

        if (distance < 0.5) return target;

        const normalized = Vec.scale(direction, 1 / distance);

        // Check for obstacles in the direct path
        const checkDistance = Math.min(distance, 5);
        const checkPosition = Vec.add(this.zombie.position, Vec.scale(normalized, checkDistance));

        // Simple obstacle avoidance - check nearby objects
        const nearbyObjects = this.zombie.game.grid.intersectsHitbox(
            new RectangleHitbox(Vec.sub(checkPosition, { x: 2, y: 2 }), Vec.add(checkPosition, { x: 2, y: 2 }))
        );

        let hasObstacle = false;
        for (const obj of nearbyObjects) {
            if (obj.isObstacle && !obj.definition.noCollisions) {
                hasObstacle = true;
                break;
            }
        }

        if (hasObstacle) {
            // Try to go around obstacle
            const perpendicular = Vec.rotate(normalized, Math.PI / 2);
            const avoidanceDirection = Vec.add(normalized, Vec.scale(perpendicular, 0.5));
            return Vec.add(this.zombie.position, Vec.scale(Vec.normalize(avoidanceDirection), 3));
        }

        return Vec.add(this.zombie.position, Vec.scale(normalized, Math.min(distance, 3)));
    }

    /**
     * Pack behavior - coordinate with nearby zombies
     */
    private coordinateWithPack(): void {
        if (!this.zombie.zombieType.packBehavior) return;

        const nearbyZombies = Array.from(this.zombie.game.zombies || [])
            .filter(z => z !== this.zombie && !z.dead)
            .filter(z => Geometry.distance(this.zombie.position, z.position) <= ZombieAIConstants.groupRadius);

        if (nearbyZombies.length === 0) return;

        // If pack has a target, adopt it
        for (const zombie of nearbyZombies) {
            if (zombie.ai._target && zombie.ai._currentState === ZombieAIState.Hunting) {
                if (!this._target || this.zombie.game.now - this._lastTargetSwitch > 1000) {
                    this.setState(ZombieAIState.Hunting, zombie.ai._target);
                    break;
                }
            }
        }
    }

    /**
     * LOD (Level of Detail) System Implementation
     * Optimizes AI processing based on distance to nearest player
     */
    private updateLODLevel(): void {
        const nearestPlayer = this.findNearestPlayer();
        this._distanceToNearestPlayer = nearestPlayer
            ? Geometry.distance(this.zombie.position, nearestPlayer.position)
            : Infinity;

        const thresholds = ZombieAIConstants.lodDistanceThresholds;

        if (this._distanceToNearestPlayer <= thresholds.high) {
            this._lodLevel = 0; // High detail
        } else if (this._distanceToNearestPlayer <= thresholds.medium) {
            this._lodLevel = 1; // Medium detail
        } else if (this._distanceToNearestPlayer <= thresholds.low) {
            this._lodLevel = 2; // Low detail
        } else {
            this._lodLevel = 3; // Minimal detail
        }
    }

    /**
     * Get pathfinding update interval based on current LOD level
     */
    private getPathfindingInterval(): number {
        const intervals = ZombieAIConstants.lodUpdateIntervals;

        switch (this._lodLevel) {
            case 0: return intervals.high;    // 500ms
            case 1: return intervals.medium;  // 1000ms
            case 2: return intervals.low;     // 2000ms
            case 3: return intervals.minimal; // 5000ms
            default: return intervals.high;
        }
    }

    /**
     * Determine if AI state should be updated based on LOD level
     */
    private shouldUpdateAIState(): boolean {
        switch (this._lodLevel) {
            case 0: return true;  // High detail: Always update
            case 1: return true;  // Medium detail: Always update
            case 2: return Math.random() < 0.7; // Low detail: 70% chance
            case 3: return Math.random() < 0.3; // Minimal detail: 30% chance
            default: return true;
        }
    }

    /**
     * Get current LOD level for debugging and monitoring
     */
    getLODLevel(): number {
        return this._lodLevel;
    }

    /**
     * Get distance to nearest player for monitoring
     */
    getDistanceToNearestPlayer(): number {
        return this._distanceToNearestPlayer;
    }
}
