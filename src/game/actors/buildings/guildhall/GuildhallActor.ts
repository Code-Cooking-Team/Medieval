import { config } from '+config'
import { ResidenceTrait } from '+game/actors/buildingTraits/ResidenceTrait'
import { type BuildingTrait } from '+game/actors/buildingTraits/types'
import { isHumanActor } from '+game/actors/helpers'
import type { HumanActor } from '+game/actors/units/human/HumanActor'
import { type Actor } from '+game/core/Actor'
import { WoodStorageBuilding } from '+game/core/WoodStorageBuilding'
import { WoodcutterProfession } from '+game/professions/WoodcutterProfession'
import { ActorType, type Position } from '+game/types'

import { guildhallBlueprint } from './GuildhallBlueprint'

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

    protected readonly deliveryOffsets: Position[] = [
        [0, -6],
        [-1, -6],
        [1, -6],
        [-1, 5],
        [1, 5],
    ]

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

    public withdrawMeat(amount: number): number {
        const withdrawn = Math.min(this.meatStock, amount)
        if (withdrawn <= 0) return 0

        this.meatStock -= withdrawn
        this.game.emitter.emit('meatStockChanged', this)
        return withdrawn
    }

    public readonly workerAssignmentLabel: string = 'Set wood drop-off'

    public canAssignWorker(
        actor: Actor,
    ): actor is HumanActor & { profession: WoodcutterProfession } {
        return (
            !this.isDead() &&
            isHumanActor(actor) &&
            actor.player === this.player &&
            !actor.isDead() &&
            actor.profession instanceof WoodcutterProfession
        )
    }

    public interact(actors: Actor[]) {
        let assigned = false
        for (const actor of actors) {
            if (!this.canAssignWorker(actor)) continue
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
