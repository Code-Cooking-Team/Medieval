import { actorByType } from '+game/actors'
import { isHumanActor } from '+game/actors/helpers'
import { Actor } from '+game/core/Actor'
import { BuildingActor, BuildingActorJSON } from '+game/core/BuildingActor'
import { WoodcutterProfession } from '+game/professions/WoodcutterProfession'
import { ActorType } from '+game/types'

import { WoodCampBlueprint } from './WoodCampBlueprint'

export class WoodCampActor extends BuildingActor {
    public type = ActorType.WoodCamp
    public blueprint = actorByType[this.type].blueprint as WoodCampBlueprint

    public readonly woodCapacity = 500
    public woodStock = 0

    public getDeliveryPosition() {
        return this.getGlobalPositionOfLocalPoint(this.blueprint.config.deliveryPoint)
    }

    public getFreeWoodStorage() {
        return this.woodCapacity - this.woodStock
    }

    public collectTree(amount: number): number {
        const accepted = Math.min(amount, this.getFreeWoodStorage())
        if (accepted <= 0) return 0

        this.woodStock += accepted
        this.game.emitter.emit('woodStockChanged', this)
        return accepted
    }

    public toJSON(): WoodCampJSON {
        return { ...super.toJSON(), woodStock: this.woodStock }
    }

    public fromJSON(json: WoodCampJSON): void {
        super.fromJSON(json)
        this.woodStock = Math.min(json.woodStock ?? 0, this.woodCapacity)
    }

    public interact(actors: Actor[]) {
        let interactionHappened = false
        for (const actor of actors) {
            if (isHumanActor(actor)) {
                const profession = new WoodcutterProfession(this.game, actor)
                profession.setCamp(this)
                actor.setProfession(profession)
                interactionHappened = true
            }
        }
        return interactionHappened
    }
}

interface WoodCampJSON extends BuildingActorJSON {
    woodStock?: number
}
