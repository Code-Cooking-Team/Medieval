import { isHumanActor } from '+game/actors/helpers'
import { Actor } from '+game/core/Actor'
import { BuildingActor } from '+game/core/BuildingActor'
import { WoodcutterProfession } from '+game/professions/WoodcutterProfession'
import { ActorType, Position } from '+game/types'
import { TileCodeGrid } from '+game/world/tileCodes'
import { addPosition } from '+helpers'

export class WoodCampActor extends BuildingActor {
    public type = ActorType.WoodCamp

    public readonly grid: TileCodeGrid = [
        ['🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🛖', '🧱', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🛖', '🧱', '🟢'],
        ['🟢', '🦶🏽', '🦶🏽', '🦶🏽', '🧱', '🛖', '🧱', '🟢'],
        ['🧱', '🧱', '🧱', '🦶🏽', '🧱', '🛖', '🧱', '🟢'],
        ['🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢'],
    ]

    private readonly deliveryLocalPosition: Position = [2, 5]

    public collectedTreeHP = 0

    // TODO Take into account ROTATION
    public getDeliveryPoint() {
        return addPosition(this.getGlobalPosition(), this.deliveryLocalPosition)
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
