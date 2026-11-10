import { isHumanActor } from '+game/actors/helpers'
import { type Actor } from '+game/core/Actor'
import { BuildingActor, type BuildingActorJSON } from '+game/core/BuildingActor'
import { HunterProfession } from '+game/professions/HunterProfession'
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
        for (const human of actors.filter(isHumanActor)) {
            if (human.player !== this.player || human.isDead()) continue
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
