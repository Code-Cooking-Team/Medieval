import { isHumanActor } from '+game/actors/helpers'
import { Actor } from '+game/core/Actor'
import { BuildingActor } from '+game/core/BuildingActor'
import { WoodcutterProfession } from '+game/professions/WoodcutterProfession'
import { ActorType } from '+game/types'
import { TileCodeGrid } from '+game/word/tileCodes'

export class WoodCampActor extends BuildingActor {
    public type = ActorType.WoodCamp

    public readonly grid: TileCodeGrid = [
        ['🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽'],
        ['🦶🏽', '🧱', '🧱', '🧱', '🦶🏽'],
        ['🦶🏽', '🧱', '🛖', '🧱', '🦶🏽'],
        ['🦶🏽', '🧱', '🛖', '🧱', '🦶🏽'],
        ['🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽'],
    ]

    private collectedTreeHP = 0

    public collectTree(hp: number) {
        this.collectedTreeHP += hp
    }

    public interact(actors: Actor[]) {
        let interactionHappened = false
        for (const actor of actors) {
            if (isHumanActor(actor)) {
                actor.setProfession(new WoodcutterProfession(this.game, actor, this))
                interactionHappened = true
            }
        }
        return interactionHappened
    }
}
