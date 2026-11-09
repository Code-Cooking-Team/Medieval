import { actorByType } from '+game/actors'
import { isHumanActor } from '+game/actors/helpers'
import { Actor } from '+game/core/Actor'
import { WoodStorageBuilding } from '+game/core/WoodStorageBuilding'
import { WoodcutterProfession } from '+game/professions/WoodcutterProfession'
import { ActorType } from '+game/types'

import { WoodCampBlueprint } from './WoodCampBlueprint'

export class WoodCampActor extends WoodStorageBuilding {
    public type = ActorType.WoodCamp
    public blueprint = actorByType[this.type].blueprint as WoodCampBlueprint

    public getDeliveryPosition() {
        return this.getGlobalPositionOfLocalPoint(this.blueprint.config.deliveryPoint)
    }

    public interact(actors: Actor[]) {
        let interactionHappened = false
        for (const actor of actors) {
            if (isHumanActor(actor)) {
                const profession = actor.profession
                if (profession instanceof WoodcutterProfession) {
                    profession.setCamp(this)
                } else {
                    const woodcutter = new WoodcutterProfession(this.game, actor)
                    woodcutter.setCamp(this)
                    actor.setProfession(woodcutter)
                }
                interactionHappened = true
            }
        }
        return interactionHappened
    }
}
