import { actorByType } from '+game/actors'
import { isHumanActor } from '+game/actors/helpers'
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

    public isAssignedTo(builder: BuilderProfession) {
        const { actor } = builder
        return (
            actor.profession === builder &&
            actor.player === this.player &&
            !actor.isDead() &&
            builder.queue.includes(this.id)
        )
    }

    public assign(actor: Actor) {
        if (
            !isHumanActor(actor) ||
            actor.isDead() ||
            actor.player !== this.player ||
            this.game.getActorById(this.id) !== this
        )
            return false

        const builder =
            actor.profession instanceof BuilderProfession
                ? actor.profession
                : new BuilderProfession(this.game, actor)
        if (builder !== actor.profession) actor.setProfession(builder)
        if (!builder.queue.includes(this.id)) builder.enqueue(this.id)
        return true
    }

    public unassign() {
        for (const actor of this.game.actors.filter(isHumanActor)) {
            const builder = actor.profession
            if (builder instanceof BuilderProfession && this.isAssignedTo(builder)) {
                builder.removeSite(this.id)
            }
        }
    }

    public interact(actors: Actor[]) {
        let assigned = false
        for (const actor of actors) {
            if (this.assign(actor)) assigned = true
        }
        return assigned
    }

    public deliver(builder: BuilderProfession, amount: number) {
        if (!this.isAssignedTo(builder) || this.game.getActorById(this.id) !== this)
            return 0
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
