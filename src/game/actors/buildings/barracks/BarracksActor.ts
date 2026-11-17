import { config } from '+config'
import { isHumanActor } from '+game/actors/helpers'
import type { HumanActor } from '+game/actors/units/human/HumanActor'
import { type Actor } from '+game/core/Actor'
import { BuildingActor } from '+game/core/BuildingActor'
import { GuardianProfession } from '+game/professions/GuardianProfession'
import { ProfessionType } from '+game/professions/types'
import { ActorType } from '+game/types'

import { barracksBlueprint } from './BarracksBlueprint'

export class BarracksActor extends BuildingActor {
    public type = ActorType.Barracks
    public blueprint = barracksBlueprint

    public maxHp = config.barracks.hp
    public hp = this.maxHp

    public tick(): void {}

    public readonly workerAssignmentLabel: string = `Assign as ${ProfessionType.Guardian}`

    public canAssignWorker(actor: Actor): actor is HumanActor {
        return isHumanActor(actor)
    }

    public interact(actors: Actor[]) {
        let interactionHappened = false
        for (const actor of actors) {
            if (this.canAssignWorker(actor)) {
                const profession = new GuardianProfession(this.game, actor)
                actor.setProfession(profession)
                interactionHappened = true
            }
        }
        return interactionHappened
    }
}
