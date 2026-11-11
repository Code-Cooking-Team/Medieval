import { config } from '+config'
import { ResidenceTrait } from '+game/actors/buildingTraits/ResidenceTrait'
import { type BuildingTrait } from '+game/actors/buildingTraits/types'
import { isHumanActor } from '+game/actors/helpers'
import { type Actor } from '+game/core/Actor'
import { WoodStorageBuilding } from '+game/core/WoodStorageBuilding'
import { WoodcutterProfession } from '+game/professions/WoodcutterProfession'
import { ActorType, type Position } from '+game/types'
import { addPosition } from '+helpers/math'

import { guildhallBlueprint } from './GuildhallBlueprint'

// Entrance path relative to the footprint center for each rotation.
const deliveryOffsets: Position[] = [
    [0, -6],
    [6, 0],
    [0, 6],
    [-6, 0],
]

export class GuildhallActor extends WoodStorageBuilding {
    public type = ActorType.Guildhall
    public blueprint = guildhallBlueprint

    public maxHp = config.guildhall.hp
    public hp = this.maxHp

    public woodStock = this.woodCapacity
    public readonly meatCapacity = 300
    public meatStock = this.meatCapacity

    public traits: BuildingTrait[] = [
        new ResidenceTrait(this, {
            residentsLimit: 5,
            spawnPosition: this.position,
        }),
    ]

    public getDeliveryPosition(): Position {
        return addPosition(this.position, deliveryOffsets[this.rotation]!)
    }

    public getFreeMeatStorage() {
        return this.meatCapacity - this.meatStock
    }

    public collectMeat(amount: number) {
        const accepted = Math.max(0, Math.min(amount, this.getFreeMeatStorage()))
        if (accepted > 0) {
            this.meatStock += accepted
            this.game.emitter.emit('meatStockChanged', this)
        }
        return accepted
    }

    public interact(actors: Actor[]) {
        if (this.isDead()) return false
        let assigned = false
        for (const actor of actors) {
            if (!isHumanActor(actor) || actor.player !== this.player || actor.isDead())
                continue
            if (!(actor.profession instanceof WoodcutterProfession)) continue
            actor.profession.setCamp(this)
            assigned = true
        }
        return assigned
    }

    public toJSON() {
        return { ...super.toJSON(), meatStock: this.meatStock }
    }

    public fromJSON(
        json: ReturnType<WoodStorageBuilding['toJSON']> & { meatStock?: number },
    ) {
        super.fromJSON(json)
        this.meatStock = Math.max(
            0,
            Math.min(json.meatStock ?? this.meatCapacity, this.meatCapacity),
        )
    }
}
