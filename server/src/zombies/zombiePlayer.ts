import { GameConstants, ObjectCategory, PlayerActions } from "@common/constants";
import { Guns } from "@common/definitions/items/guns";
import { Melees } from "@common/definitions/items/melees";
import { Skins } from "@common/definitions/items/skins";
import { PacketType } from "@common/packets/packet";
import { CircleHitbox } from "@common/utils/hitbox";
import { Angle, Geometry } from "@common/utils/math";
import { pickRandomInArray } from "@common/utils/random";
import { Vec, type Vector } from "@common/utils/vector";
import { type Game } from "../game";
import { Player } from "../objects/player";
import { type ZombieTypeDefinition } from "./zombieTypes";
import { ZombieAI } from "./zombieAI";

export class ZombiePlayer extends Player {
    readonly isZombie = true;
    readonly zombieType: ZombieTypeDefinition;
    readonly ai: ZombieAI;
    
    private _baseStats: {
        health: number;
        speed: number;
        damage: number;
    };
    
    private _evolutionMultiplier = 1;
    private _lastAttackTime = 0;
    private _attackCooldown = 1000; // 1 second between attacks
    
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
        game.log(`Zombie ${this.name} created with skin: ${this.loadout.skin?.idString || 'none'}`);
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
        
        // Set movement based on AI
        this.movement.up = aiState.movement.up;
        this.movement.down = aiState.movement.down;
        this.movement.left = aiState.movement.left;
        this.movement.right = aiState.movement.right;
        
        // Set rotation to face target
        if (aiState.target) {
            const direction = Vec.sub(aiState.target, this.position);
            this.rotation = Math.atan2(direction.y, direction.x);
            this.turning = true;
        }
        
        // Handle attacking
        if (aiState.shouldAttack && this.canAttack()) {
            this.attacking = true;
            this.startedAttacking = true;
            this._lastAttackTime = this.game.now;
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
    override damage(params: any): void {
        super.damage(params);
        
        // Notify AI of taking damage
        if (params.source?.isPlayer && !params.source.isZombie) {
            this.ai.onTakeDamage(params.source);
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
            source: this as any,
            weaponUsed: this.activeItem
        });

        this._lastAttackTime = this.game.now;

        // Add visual/audio effects (if method exists)
        // this.game.addEmote(this, "skull");
    }
}
