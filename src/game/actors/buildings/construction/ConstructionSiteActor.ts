import { actorByType } from '+game/actors'
import { isHumanActor } from '+game/actors/helpers'
import type { HumanActor } from '+game/actors/units/human/HumanActor'
import { Actor } from '+game/core/Actor'
import { BuildingActor, BuildingActorJSON } from '+game/core/BuildingActor'
import { BuilderProfession } from '+game/professions/BuilderProfession'
import { ActorType } from '+game/types'

import { constructionCosts, ConstructionType } from './costs'

export class ConstructionSiteActor extends BuildingActor {
    public type = ActorType.ConstructionSite
    public buildingType: ConstructionType = ActorType.House
    public deliveredWood = 0

    public setBuildingType(type: ConstructionType) {
        this.buildingType = type
        this.blueprint = actorByType[type].blueprint!
    }

    public get remainingWood() {
        return constructionCosts[this.buildingType] - this.deliveredWood
    }

    public get assignedBuilder() {
        return this.game.actors.find(
            (actor): actor is HumanActor =>
                isHumanActor(actor) &&
                !actor.isDead() &&
                actor.profession instanceof BuilderProfession &&
                actor.profession.queue.includes(this.id),
        )
    }

    public assign(actor: Actor) {
        if (
            !isHumanActor(actor) ||
            actor.isDead() ||
            actor.player !== this.player ||
            this.assignedBuilder ||
            this.game.getActorById(this.id) !== this
        )
            return false

        const builder =
            actor.profession instanceof BuilderProfession
                ? actor.profession
                : new BuilderProfession(this.game, actor)
        if (builder !== actor.profession) actor.setProfession(builder)
        builder.enqueue(this.id)
        return true
    }

    public unassign() {
        const builder = this.assignedBuilder?.profession
        if (builder instanceof BuilderProfession) builder.removeSite(this.id)
    }

    public interact(actors: Actor[]) {
        return actors.length === 1 && this.assign(actors[0]!)
    }

    public deliver(builder: BuilderProfession, amount: number) {
        if (this.assignedBuilder !== builder.actor) return 0
        const accepted = Math.min(this.remainingWood, amount)
        if (accepted <= 0) return 0
        this.deliveredWood += accepted
        this.game.emitter.emit('constructionProgress', this)
        if (this.remainingWood === 0) this.game.completeConstruction(this)
        return accepted
    }

    public toJSON(): ConstructionSiteJSON {
        return {
            ...super.toJSON(),
            buildingType: this.buildingType,
            deliveredWood: this.deliveredWood,
        }
    }

    public fromJSON(json: ConstructionSiteJSON) {
        super.fromJSON(json)
        this.setBuildingType(json.buildingType)
    }
}

interface ConstructionSiteJSON extends BuildingActorJSON {
    buildingType: ConstructionType
    deliveredWood: number
}
