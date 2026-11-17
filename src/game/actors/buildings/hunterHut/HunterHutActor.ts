import { isHumanActor } from '+game/actors/helpers'
import type { HumanActor } from '+game/actors/units/human/HumanActor'
import { type Actor } from '+game/core/Actor'
import { BuildingActor, type BuildingActorJSON } from '+game/core/BuildingActor'
import { HunterProfession } from '+game/professions/HunterProfession'
import { ProfessionType } from '+game/professions/types'
import { ActorType } from '+game/types'

import { hunterHutBlueprint } from './HunterHutBlueprint'

export class HunterHutActor extends BuildingActor {
    public type = ActorType.HunterHut
    public blueprint = hunterHutBlueprint
    public readonly meatCapacity = 500
    public meatStock = 0

    public getDeliveryPosition() {
        return this.getGlobalPositionOfLocalPoint(this.blueprint.config.deliveryPoint)
    }

    public getFreeMeatStorage() {
        return this.meatCapacity - this.meatStock
    }

    public withdrawMeat(amount: number): number {
        const withdrawn = Math.min(this.meatStock, amount)
        if (withdrawn <= 0) return 0

        this.meatStock -= withdrawn
        this.game.emitter.emit('meatStockChanged', this)
        return withdrawn
    }

    public collectMeat(amount: number) {
        const accepted = Math.max(0, Math.min(amount, this.getFreeMeatStorage()))
        if (accepted > 0) {
            this.meatStock += accepted
            this.game.emitter.emit('meatStockChanged', this)
        }
        return accepted
    }

    public readonly workerAssignmentLabel: string = `Assign as ${ProfessionType.Hunter}`

    public canAssignWorker(actor: Actor): actor is HumanActor {
        return (
            !this.isDead() &&
            isHumanActor(actor) &&
            actor.player === this.player &&
            !actor.isDead()
        )
    }

    public interact(actors: Actor[]) {
        let assigned = false
        for (const human of actors) {
            if (!this.canAssignWorker(human)) continue
            const hunter =
                human.profession instanceof HunterProfession
                    ? human.profession
                    : new HunterProfession(this.game, human)
            hunter.setHut(this)
            human.setProfession(hunter)
            assigned = true
        }
        return assigned
    }

    public toJSON(): HunterHutJSON {
        return { ...super.toJSON(), meatStock: this.meatStock }
    }

    public fromJSON(json: HunterHutJSON) {
        super.fromJSON(json)
        this.meatStock = Math.max(0, Math.min(json.meatStock ?? 0, this.meatCapacity))
    }
}

interface HunterHutJSON extends BuildingActorJSON {
    meatStock?: number
}
