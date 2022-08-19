import { config } from '+config'
import { actorByType } from '+game/actors'
import { isHumanActor } from '+game/actors/helpers'
import { Actor } from '+game/core/Actor'
import { BuildingActor } from '+game/core/BuildingActor'
import { GuardianProfession } from '+game/professions/GuardianProfession'
import { ActorType } from '+game/types'

import { GuildhallBlueprint } from './GuildhallBlueprint'

export class GuildhallActor extends BuildingActor {
    public type = ActorType.Guildhall
    public blueprint = actorByType[this.type].blueprint as GuildhallBlueprint

    public maxHp = config.guildhall.hp
    public hp = this.maxHp

    public tick(): void {}

    public interact(actors: Actor[]) {
        let interactionHappened = false
        for (const actor of actors) {
            if (isHumanActor(actor)) {
                const profession = new GuardianProfession(this.game, actor)
                actor.setProfession(profession)
                interactionHappened = true
            }
        }
        return interactionHappened
    }
}
