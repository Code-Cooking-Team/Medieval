import { isHumanActor } from '+game/actors/helpers'
import { type ActorLike } from '+game/core/ActorLike'
import { BuildingActor } from '+game/core/BuildingActor'
import { WoodcutterProfession } from '+game/professions/WoodcutterProfession'
import { ActorType } from '+game/types'

import { woodCampBlueprint } from './WoodCampBlueprint'

export class WoodCampActor extends BuildingActor {
    public type = ActorType.WoodCamp
    public blueprint = woodCampBlueprint

    public collectedTreeHP = 0

    public getDeliveryPosition() {
        return this.getGlobalPositionOfLocalPoint(this.blueprint.config.deliveryPoint)
    }

    public collectTree(hp: number) {
        this.collectedTreeHP += hp
    }

    public interact(actors: ActorLike[]) {
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
