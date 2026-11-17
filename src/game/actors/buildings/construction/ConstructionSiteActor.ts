import { isHumanActor } from '+game/actors/helpers'
import type { HumanActor } from '+game/actors/units/human/HumanActor'
import { type Actor } from '+game/core/Actor'
import { BuildingActor, type BuildingActorJSON } from '+game/core/BuildingActor'
import { BuilderProfession } from '+game/professions/BuilderProfession'
import { ProfessionType } from '+game/professions/types'
import { ActorType } from '+game/types'

import { buildingBlueprints } from './blueprints'
import { constructionCosts, type ConstructionType } from './costs'

export class ConstructionSiteActor extends BuildingActor {
    public type = ActorType.ConstructionSite
    public buildingType: ConstructionType = ActorType.House
    public deliveredWood = 0

    public setBuildingType(type: ConstructionType) {
        this.buildingType = type
        this.blueprint = buildingBlueprints[type]
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

    public readonly workerAssignmentLabel: string = `Assign as ${ProfessionType.Builder}`

    public canAssignWorker(actor: Actor): actor is HumanActor {
        return (
            isHumanActor(actor) &&
            actor.player === this.player &&
            !actor.isDead() &&
            this.game.getActorById(this.id) === this
        )
    }

    public assign(actor: Actor) {
        if (!this.canAssignWorker(actor)) return false

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
