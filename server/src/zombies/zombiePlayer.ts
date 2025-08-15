import { Melees } from "@common/definitions/items/melees";
import { Skins } from "@common/definitions/items/skins";
import { Geometry } from "@common/utils/math";
import { Vec, type Vector } from "@common/utils/vector";
import { type Game } from "../game";
import { Player } from "../objects/player";
import { type DamageParams } from "../objects/gameObject";
import { type ZombieTypeDefinition } from "./zombieTypes";
import { ZombieAI } from "./zombieAI";

export class ZombiePlayer extends Player {
    readonly isZombie = true;
    readonly zombieType: ZombieTypeDefinition;
    readonly ai: ZombieAI;

    private readonly _baseStats: {
        health: number
        speed: number
        damage: number
    };

    private _evolutionMultiplier = 1;
    private _lastAttackTime = 0;
    private readonly _attackCooldown = 1000; // 1 second between attacks

    constructor(game: Game, zombieType: ZombieTypeDefinition, position: Vector) {
        // Create zombie without socket (AI controlled)
        super(game, undefined, position);

        // Zombie flag is set by class property

        this.zombieType = zombieType;
        this._baseStats = {
            health: zombieType.health,
            speed: zombieType.speed,
            damage: zombieType.damage
        };

        // Initialize zombie with appropriate stats
        this.health = this.maxHealth = zombieType.health;
        this.name = `${zombieType.name}_${Math.floor(Math.random() * 1000)}`;

        // Set zombie appearance
        this.loadout.skin = Skins.fromString(zombieType.skin) || Skins.fromString("hazel_jumpsuit");

        // Give zombie basic melee weapon - use fists as default
        const fistsWeapon = Melees.fromStringSafe("fists");
        if (fistsWeapon) {
            this.inventory.addOrReplaceWeapon(2, fistsWeapon);
            this.inventory.setActiveWeaponIndex(2);
        }

        // Initialize AI
        this.ai = new ZombieAI(this);

        // Mark as joined to avoid timeout
        this.joined = true;

        // Ensure zombie is visible to clients
        this.setDirty();

        // Debug logging
        game.log(`Zombie ${this.name} created with skin: ${this.loadout.skin?.idString || "none"}`);
    }

    override update(): void {
        if (this.dead) return;

        // Update AI behavior
        this.ai.update();

        // Apply AI movement and actions
        this.processAIInputs();

        // Call parent update
        super.update();
    }

    private processAIInputs(): void {
        const aiState = this.ai.getCurrentState();

        // Validate AI state before applying
        if (!aiState?.movement) {
            this.game.log(`Invalid AI state for zombie ${this.name}`);
            return;
        }

        // Validate movement inputs
        const movement = aiState.movement;
        this.movement.up = movement.up;
        this.movement.down = movement.down;
        this.movement.left = movement.left;
        this.movement.right = movement.right;

        // Validate target position
        if (aiState.target) {
            const target = aiState.target;
            if (isFinite(target.x) && isFinite(target.y)) {
                const direction = Vec.sub(target, this.position);
                const angle = Math.atan2(direction.y, direction.x);

                if (isFinite(angle)) {
                    this.rotation = angle;
                    this.turning = true;
                }
            }
        }

        // Validate attack state
        if (aiState.shouldAttack !== undefined && this.canAttack()) {
            this.attacking = aiState.shouldAttack;
            this.startedAttacking = aiState.shouldAttack;
            if (aiState.shouldAttack) {
                this._lastAttackTime = this.game.now;
            }
        } else {
            this.attacking = false;
            this.startedAttacking = false;
        }

        this.stoppedAttacking = false;
    }

    private canAttack(): boolean {
        return this.game.now - this._lastAttackTime >= this._attackCooldown;
    }

    evolve(multiplier: number): void {
        this._evolutionMultiplier = multiplier;

        // Update stats based on evolution
        const newMaxHealth = Math.floor(this._baseStats.health * multiplier);
        const healthRatio = this.health / this.maxHealth;

        this.maxHealth = newMaxHealth;
        this.health = Math.floor(newMaxHealth * healthRatio);

        // Update other stats - speed is handled by movement multiplier
        // this.speed = this._baseStats.speed * multiplier;

        this.setDirty();

        // Notify AI of evolution
        this.ai.onEvolution(multiplier);
    }

    getEvolutionMultiplier(): number {
        return this._evolutionMultiplier;
    }

    getZombieDamage(): number {
        return Math.floor(this._baseStats.damage * this._evolutionMultiplier);
    }

    getDetectionRange(): number {
        return this.zombieType.detectionRange * this._evolutionMultiplier;
    }

    getAttackRange(): number {
        return this.zombieType.attackRange;
    }

    // Override to prevent normal player behaviors
    override processInputs(): void {
        // Zombies don't process normal input packets
    }

    override disconnect(): void {
        // Remove from zombie tracking
        this.game.zombies?.delete(this);
        super.disconnect();
    }

    // Override damage to apply zombie-specific logic
    override damage(params: DamageParams): void {
        super.damage(params);

        // Notify AI of taking damage
        const src = params.source;
        if (src && typeof src === "object" && "isPlayer" in src && (src as Player).isPlayer && !(src as Player).isZombie) {
            this.ai.onTakeDamage(src as Player);
        }
    }

    // Custom method for zombie attacks
    zombieAttack(target: Player): void {
        if (!this.canAttack() || this.dead) return;

        const distance = Geometry.distance(this.position, target.position);
        if (distance > this.getAttackRange()) return;

        // Deal damage to target
        target.damage({
            amount: this.getZombieDamage(),
            source: this,
            weaponUsed: this.activeItem
        });

        this._lastAttackTime = this.game.now;

        // Add visual/audio effects (if method exists)
        // this.game.addEmote(this, "skull");
    }

    /**
     * Get current LOD level for monitoring and metrics
     */
    getLODLevel(): number {
        return this.ai.getLODLevel();
    }

    /**
     * Get distance to nearest player for monitoring
     */
    getDistanceToNearestPlayer(): number {
        return this.ai.getDistanceToNearestPlayer();
    }
}
