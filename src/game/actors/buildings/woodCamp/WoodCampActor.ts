import { isHumanActor } from '+game/actors/helpers'
import type { HumanActor } from '+game/actors/units/human/HumanActor'
import { type Actor } from '+game/core/Actor'
import { WoodStorageBuilding } from '+game/core/WoodStorageBuilding'
import { ProfessionType } from '+game/professions/types'
import { WoodcutterProfession } from '+game/professions/WoodcutterProfession'
import { ActorType, type Position } from '+game/types'

import { woodCampBlueprint } from './WoodCampBlueprint'

export class WoodCampActor extends WoodStorageBuilding {
    public type = ActorType.WoodCamp
    public blueprint = woodCampBlueprint

    // The aisle below the covered boards and the ground around the log rack.
    protected readonly deliveryOffsets: Position[] = [
        [-2, 1],
        [-1, 2],
        [-3, 1],
        [-4, 1],
        [-3, 3],
    ]

    public readonly workerAssignmentLabel: string = `Assign as ${ProfessionType.Woodcutter}`

    public canAssignWorker(actor: Actor): actor is HumanActor {
        return isHumanActor(actor)
    }

    public interact(actors: Actor[]) {
        let interactionHappened = false
        for (const actor of actors) {
            if (this.canAssignWorker(actor)) {
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
