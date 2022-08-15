import { actorByType } from '+game/actors'
import { isHumanActor } from '+game/actors/helpers'
import { Actor } from '+game/core/Actor'
import { BuildingActor } from '+game/core/BuildingActor'
import { WoodcutterProfession } from '+game/professions/WoodcutterProfession'
import { ActorType } from '+game/types'
import { addPosition, rotatePositionOnGrind } from '+helpers'

import { WoodCampBlueprint } from './WoodCampBlueprint'

export class WoodCampActor extends BuildingActor {
    public type = ActorType.WoodCamp
    public blueprint = actorByType[this.type].blueprint as WoodCampBlueprint

    public collectedTreeHP = 0

    public getDeliveryPoint() {
        const config = this.blueprint.config
        const transposedDeliveryPosition = rotatePositionOnGrind(
            config.deliveryLocalPosition,
            this.getSize(),
            this.rotation,
        )
        return addPosition(this.getGlobalPosition(), transposedDeliveryPosition)
    }

    public collectTree(hp: number) {
        this.collectedTreeHP += hp
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
