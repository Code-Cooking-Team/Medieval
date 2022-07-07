import { StaticActor } from '+game/core/StaticActor'
import { WoodcutterProfession } from '+game/professions/WoodcutterProfession'
import { ActorType, AnyActor } from '+game/types'

import { isHumanActor } from '../helpers'

export class WoodCampActor extends StaticActor {
    public type = ActorType.WoodCamp
    private collectedTreeHP = 0

    public collectTree(hp: number) {
        this.collectedTreeHP += hp
    }

    public interact(actors: AnyActor[]) {
        for (const actor of actors) {
            if (isHumanActor(actor)) {
                actor.setProfession(new WoodcutterProfession(this.game, actor, this))
            }
        }
    }
}
