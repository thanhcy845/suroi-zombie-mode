import { GameConstants, InventoryMessages, Layer, ObjectCategory, PlayerActions } from "@common/constants";
import { ArmorType } from "@common/definitions/items/armors";
import { type GunDefinition } from "@common/definitions/items/guns";
import { Loots, type LootDefinition } from "@common/definitions/loots";
import { PickupPacket } from "@common/packets/pickupPacket";
import { CircleHitbox } from "@common/utils/hitbox";
import { adjacentOrEqualLayer } from "@common/utils/layer";
import { Collision, Geometry, Numeric } from "@common/utils/math";
import { DefinitionType, type ReifiableDef } from "@common/utils/objectDefinitions";
import { type FullData } from "@common/utils/objectsSerializations";
import { randomRotation } from "@common/utils/random";
import { FloorNames } from "@common/utils/terrain";
import { Vec, type Vector } from "@common/utils/vector";
import { type Game } from "../game";
import { GunItem } from "../inventory/gunItem";
import { BaseGameObject } from "./gameObject";
import { MapIndicator } from "./mapIndicator";
import { type Player } from "./player";

export type DataMap = Record<DefinitionType, unknown> & {
    [DefinitionType.Gun]: {
        readonly kills: number
        readonly damage: number
        readonly totalShots: number
    }
    [DefinitionType.Melee]: {
        readonly kills: number
        readonly damage: number
    }
    [DefinitionType.Throwable]: {
        readonly kills: number
        readonly damage: number
    }
};

export type ItemData<Def extends LootDefinition = LootDefinition> = DataMap[Def["defType"]];

export class Loot<Def extends LootDefinition = LootDefinition> extends BaseGameObject.derive(ObjectCategory.Loot) {
    override readonly fullAllocBytes = 4;
    override readonly partialAllocBytes = 8;

    declare readonly hitbox: CircleHitbox;

    readonly definition: Def;
    readonly itemData?: ItemData<Def>;

    private _count;
    get count(): number { return this._count; }

    isNew = true;
    velocity = Vec(0, 0);

    get position(): Vector { return this.hitbox.position; }
    set position(pos: Vector) { this.hitbox.position = pos; }

    private _oldPosition = Vec(0, 0);

    mapIndicator?: MapIndicator;

    constructor(
        game: Game,
        basis: ReifiableDef<Def>,
        position: Vector,
        layer: number,
        { count, pushVel = 0.003, data }: {
            readonly count?: number
            readonly pushVel?: number
            readonly data?: ItemData<Def>
        } = {}
    ) {
        super(game, position);

        this.definition = Loots.reify(basis);
        this.itemData = data;

        this.hitbox = new CircleHitbox(GameConstants.lootRadius[this.definition.defType], Vec.clone(position));
        this.layer = layer;

        if ((this._count = count ?? 1) <= 0) {
            throw new RangeError("Loot 'count' cannot be less than or equal to 0");
        }

        if (pushVel) this.push(randomRotation(), pushVel);

        if (this.definition.mapIndicator) {
            this.game.mapIndicators.push(this.mapIndicator = new MapIndicator(this.game, this.definition.mapIndicator, this.position));
        }

        this.game.addTimeout(() => {
            this.isNew = false;
            this.setDirty();
        }, 100);
    }

    update(): void {
        const moving = Math.abs(this.velocity.x) > 0.001
            || Math.abs(this.velocity.y) > 0.001
            || !Vec.equals(this._oldPosition, this.position);

        if (!moving) return;

        this._oldPosition = Vec.clone(this.position);

        const { terrain } = this.game.map;
        if (
            this.layer === Layer.Ground
            && terrain.getFloor(this.position, this.layer) === FloorNames.Water
            && terrain.groundRect.isPointInside(this.position)
        ) {
            for (const river of terrain.getRiversInPosition(this.position)) {
                if (!river.waterHitbox?.isPointInside(this.position)) continue;

                const tangent = river.getTangent(river.getClosestT(this.position));
                this.push(Vec.direction(tangent), -0.001);
                break;
            }
        }

        const dt = this.game.dt;
        const halfDt = dt / 2;

        const calculateSafeDisplacement = (): Vector => {
            let displacement = Vec.scale(this.velocity, halfDt);
            if (Vec.squaredLen(displacement) >= 1) {
                displacement = Vec.normalizeSafe(displacement);
            }

            return displacement;
        };

        this.position = Vec.add(this.position, calculateSafeDisplacement());
        this.velocity = Vec.scale(this.velocity, 1 / (1 + dt * 0.003));

        this.position = Vec.add(this.position, calculateSafeDisplacement());
        this.position.x = Numeric.clamp(this.position.x, this.hitbox.radius, this.game.map.width - this.hitbox.radius);
        this.position.y = Numeric.clamp(this.position.y, this.hitbox.radius, this.game.map.height - this.hitbox.radius);

        for (const object of this.game.grid.intersectsHitbox(this.hitbox)) {
            if (
                (object.isObstacle || object.isBuilding)
                && object.collidable
                && object.hitbox?.collidesWith(this.hitbox)
                && adjacentOrEqualLayer(this.layer, object.layer)
            ) {
                if (object.isObstacle && object.definition.isStair) {
                    object.handleStairInteraction(this);
                } else {
                    this.hitbox.resolveCollision(object.hitbox);
                }
            } else if (
                object.isLoot
                && object !== this
                && object.hitbox.collidesWith(this.hitbox)
                && adjacentOrEqualLayer(this.layer, object.layer)
            ) {
                const collision = Collision.circleCircleIntersection(this.position, this.hitbox.radius, object.position, object.hitbox.radius);
                if (collision) {
                    this.velocity = Vec.sub(this.velocity, Vec.scale(collision.dir, 0.0005));
                }

                const dist = Numeric.max(Geometry.distance(object.position, this.position), 1);
                const vecCollision = Vec(object.position.x - this.position.x, object.position.y - this.position.y);
                const vecCollisionNorm = Vec(vecCollision.x / dist, vecCollision.y / dist);
                const vRelativeVelocity = Vec(this.velocity.x - object.velocity.x, this.velocity.y - object.velocity.y);

                const speed = (vRelativeVelocity.x * vecCollisionNorm.x + vRelativeVelocity.y * vecCollisionNorm.y) * 0.5;

                if (speed < 0) continue;

                this.velocity.x -= speed * vecCollisionNorm.x;
                this.velocity.y -= speed * vecCollisionNorm.y;
                object.velocity.x += speed * vecCollisionNorm.x;
                object.velocity.y += speed * vecCollisionNorm.y;
            }
        }

        if (this.mapIndicator) this.mapIndicator.updatePosition(this.position);

        if (!Vec.equals(this._oldPosition, this.position)) {
            this.setPartialDirty();
            this.game.grid.updateObject(this);
        }
    }

    push(angle: number, velocity: number): void {
        this.velocity = Vec.add(this.velocity, Vec.fromPolar(angle, velocity));
    }

    canInteract(player: Player): boolean | InventoryMessages {
        if (this.dead || player.downed) return false;

        const inventory = player.inventory;
        const definition = this.definition;

        switch (definition.defType) {
            case DefinitionType.Gun: {
                let i = 0;
                for (const weapon of inventory.weapons) {
                    if (
                        weapon?.isGun === true
                        && !weapon.definition.isDual
                        && weapon.definition.dualVariant
                        && weapon.definition === definition
                        && !inventory.isLocked(i)
                    ) {
                        return true;
                    }
                    ++i;
                }

                const activeWeaponIndex = inventory.activeWeaponIndex;
                return (!inventory.hasWeapon(0) && !inventory.isLocked(0)) // slot 0 available and not locked
                    || (!inventory.hasWeapon(1) && !inventory.isLocked(1)) // slot 1 available and not locked
                    || ( // active slot is a gun slot with a gun different from this loot's
                        GameConstants.player.inventorySlotTypings[activeWeaponIndex] === DefinitionType.Gun
                        && definition !== inventory.activeWeapon.definition
                        && !inventory.isLocked(activeWeaponIndex)
                    );
            }
            case DefinitionType.HealingItem:
            case DefinitionType.Ammo:
            case DefinitionType.Throwable: {
                const idString = definition.idString;

                if (definition.defType === DefinitionType.Throwable && inventory.isLocked(3)) {
                    return false;
                } else if (inventory.items.getItem(idString) + 1 > (inventory.backpack.maxCapacity[idString] ?? 0)) {
                    return InventoryMessages.NotEnoughSpace;
                } else {
                    return true;
                }
            }
            case DefinitionType.Melee: {
                return definition !== inventory.getWeapon(2)?.definition && !inventory.isLocked(2);
            }
            case DefinitionType.Armor: {
                let threshold = -Infinity;
                switch (definition.armorType) {
                    case ArmorType.Helmet: {
                        threshold = inventory.helmet?.level ?? 0;
                        break;
                    }
                    case ArmorType.Vest: {
                        threshold = inventory.vest?.level ?? 0;
                        break;
                    }
                }

                if (definition.level < threshold) {
                    return InventoryMessages.BetterItemEquipped;
                } else if (definition.level === threshold) {
                    return InventoryMessages.ItemAlreadyEquipped;
                } else {
                    return true;
                }
            }
            case DefinitionType.Backpack: {
                if (definition.level < inventory.backpack.level) {
                    return InventoryMessages.BetterItemEquipped;
                } else if (definition.level === inventory.backpack.level) {
                    return InventoryMessages.ItemAlreadyEquipped;
                } else {
                    return true;
                }
            }
            case DefinitionType.Scope: {
                return !inventory.items.hasItem(definition.idString) || InventoryMessages.ItemAlreadyEquipped;
            }
            case DefinitionType.Skin: {
                return !player.loadout.skin.noSwap && (player.loadout.skin !== definition || InventoryMessages.ItemAlreadyEquipped);
            }
            case DefinitionType.Perk: {
                return !player.perks[0]?.noSwap && (!(player.hasPerk(definition) && !definition.alwaysAllowSwap) || InventoryMessages.ItemAlreadyEquipped);
            }
        }
    }

    interact(player: Player, canPickup?: boolean | InventoryMessages): void {
        if (
            this.dead
            || player.downed
            || this.game.pluginManager.emit("loot_will_interact", {
                loot: this,
                canPickup,
                player
            }) !== undefined
        ) return;

        const createNewItem = <D extends LootDefinition = Def>(
            { type, count }: {
                readonly type?: D
                readonly count: number
                readonly data?: ItemData<D>
            } = { count: this._count }
        ): void => {
            this.game
                .addLoot(type ?? this.definition, this.position, this.layer, { count, pushVel: 0, jitterSpawn: false, data: this.itemData })
                ?.push(player.rotation + Math.PI, 0.009);
        };

        if (canPickup === false) return;
        else if (typeof canPickup === "number") { // means it's an inventory message
            // Do not play pickup & drop on melees and guns
            if ([DefinitionType.Gun, DefinitionType.Melee].includes(this.definition.defType)) return;

            this.game.removeLoot(this);
            createNewItem();
            player.sendPacket(PickupPacket.create({ message: canPickup }));
            return;
        }

        const inventory = player.inventory;
        let countToRemove = 1;

        const definition = this.definition;
        const { idString, defType } = definition;

        switch (defType) {
            case DefinitionType.Melee: {
                const slot: number | undefined = (inventory.slotsByDefType[DefinitionType.Melee] ?? [])[0];

                // No melee slot? Nothing to do
                if (slot === undefined) {
                    countToRemove = 0;
                    break;
                }

                // Operation is safe because `slot` is guaranteed to point to a melee slot
                inventory.addOrReplaceWeapon(slot, definition);

                break;
            }
            case DefinitionType.Gun: {
                let gotDual = false;
                for (let i = 0, l = inventory.weapons.length; i < l; i++) {
                    const weapon = inventory.weapons[i];

                    if (
                        weapon?.isGun
                        && weapon.definition.dualVariant
                        && weapon.definition === definition
                    ) {
                        player.dirty.weapons = true;
                        player.setDirty();

                        const action = player.action;

                        const wasReloading = action?.type === PlayerActions.Reload;
                        if (wasReloading) action.cancel();

                        if (!player.inventory.upgradeToDual(i)) {
                            continue;
                        }

                        if (wasReloading) {
                            (player.activeItem as GunItem).reload(true);
                        }

                        gotDual = true;
                        break;
                    }
                }
                if (gotDual) break;

                const slot = inventory.appendWeapon<DefinitionType.Gun>(definition, (this as Loot<GunDefinition>).itemData);

                if (slot === -1) { // If it wasn't added, then either there are no gun slots or they're all occupied
                    /*
                        From here, the only way for the gun to make it into the inventory is for it to replace the active
                        weapon, which must be a different gun (dual weapons are already handled when we get here, so we ignore them)
                    */
                    if (inventory.activeWeapon.isGun && definition !== inventory.activeWeapon.definition) {
                        if (player.action?.type === PlayerActions.Reload) {
                            player.action.cancel();
                        }

                        // Let's replace the active item then
                        // This operation is safe because if the active item is a gun, then the current slot must be a gun slot
                        inventory.addOrReplaceWeapon(inventory.activeWeaponIndex, definition);
                    } else {
                        /*
                            Being here means that the active weapon isn't a gun, but all the gun slots (if any) are occupied
                            The loot item shouldn't be destroyed though, it should just… do nothing
                        */
                        countToRemove = 0;
                    }
                    break;
                }

                // Swap to gun slot if current slot is melee
                if (GameConstants.player.inventorySlotTypings[inventory.activeWeaponIndex] === DefinitionType.Melee) {
                    inventory.setActiveWeaponIndex(slot);
                }
                break;
            }
            case DefinitionType.HealingItem:
            case DefinitionType.Ammo:
            case DefinitionType.Throwable: {
                const currentCount = inventory.items.getItem(idString);
                const maxCapacity = inventory.backpack.maxCapacity[idString] ?? 0;

                const modifyItemCollections = (): void => {
                    if (currentCount + 1 <= maxCapacity) {
                        if (currentCount + this._count <= maxCapacity) {
                            inventory.items.incrementItem(idString, this._count);
                            countToRemove = this._count;
                        } else /* if (currentCount + this.count > maxCapacity) */ {
                            inventory.items.setItem(idString, maxCapacity);
                            countToRemove = maxCapacity - currentCount;
                            this.setDirty();
                        }
                    }
                };

                if (definition.defType === DefinitionType.Throwable) {
                    const slot: number | undefined = (inventory.slotsByDefType[DefinitionType.Throwable] ?? [])[0];

                    // No grenade slot? Nothing to do, don't even add it to the inventory's item collection
                    if (slot === undefined) {
                        countToRemove = 0;
                        break;
                    }

                    modifyItemCollections();

                    inventory.useItem(idString);

                    // hope that `throwableItemMap` is sync'd
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    inventory.throwableItemMap.get(idString)!.count = inventory.items.getItem(idString);
                } else {
                    modifyItemCollections();
                }
                break;
            }
            case DefinitionType.Armor: {
                switch (definition.armorType) {
                    case ArmorType.Helmet:
                        if (player.inventory.helmet) createNewItem({ type: player.inventory.helmet, count: 1 });
                        player.inventory.helmet = definition;
                        break;
                    case ArmorType.Vest:
                        if (player.inventory.vest) createNewItem({ type: player.inventory.vest, count: 1 });
                        player.inventory.vest = definition;
                }

                if (definition.perk !== undefined) {
                    player.addPerk(definition.perk);
                }

                player.setDirty();
                break;
            }
            case DefinitionType.Backpack: {
                if (player.inventory.backpack.level > 0) createNewItem({ type: player.inventory.backpack, count: 1 });
                player.inventory.backpack = definition;

                if (definition.perk !== undefined) {
                    player.addPerk(definition.perk);
                }

                player.setDirty();
                break;
            }
            case DefinitionType.Scope: {
                inventory.items.setItem(idString, 1);

                if (definition.zoomLevel > player.inventory.scope.zoomLevel) {
                    player.inventory.scope = idString;
                }

                break;
            }
            case DefinitionType.Skin: {
                if (player.loadout.skin === definition) {
                    countToRemove = 0; // eipi's fix
                    break;
                }

                createNewItem({ type: player.loadout.skin, count: 1 });
                player.loadout.skin = definition;

                player.setDirty();
                break;
            }

            case DefinitionType.Perk: {
                const perkToRemove = player.perks.find(perk => perk.category === definition.category);

                if (perkToRemove !== undefined) {
                    if (!perkToRemove.noDrop) {
                        createNewItem({ type: perkToRemove, count: 1 });
                    }
                    player.removePerk(perkToRemove);
                }

                player.addPerk(definition);
                break;
            }
        }
        this._count -= countToRemove;

        player.dirty.items = true;

        // Destroy the old loot
        this.game.removeLoot(this);

        // Send pickup packet
        player.sendPacket(
            PickupPacket.create({
                item: this.definition
            })
        );

        // If the item wasn't deleted, create a new loot item pushed slightly away from the player
        if (this._count > 0) createNewItem();

        this.game.pluginManager.emit("loot_did_interact", {
            loot: this,
            player
        });

        // Reload active gun if the player picks up the correct ammo
        const activeWeapon = player.inventory.activeWeapon;
        if (
            activeWeapon.isGun
            && activeWeapon.ammo === 0
            && idString === activeWeapon.definition.ammoType
        ) {
            activeWeapon.reload();
        }

        if (definition.mapIndicator !== undefined) {
            player.updateMapIndicator();
        }

        if (this.mapIndicator) {
            this.mapIndicator.dead = true;
        }
    }

    override get data(): FullData<ObjectCategory.Loot> {
        return {
            position: this.position,
            layer: this.layer,
            full: {
                definition: this.definition,
                count: this._count,
                isNew: this.isNew
            }
        };
    }

    override damage(): void { /* can't damage a loot item */ }
}
