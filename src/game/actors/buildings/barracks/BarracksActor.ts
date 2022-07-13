import { config } from '+config'
import { isHumanActor } from '+game/actors/helpers'
import { Actor } from '+game/core/Actor'
import { BuildingActor } from '+game/core/BuildingActor'
import { GuardianProfession } from '+game/professions/GuardianProfession'
import { ActorType } from '+game/types'
import { TileCodeGrid } from '+game/world/tileCodes'

export class BarracksActor extends BuildingActor {
    public type = ActorType.Barracks

    public grid: TileCodeGrid = [
        ['🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽'],
        ['🦶🏽', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🦶🏽', '🧱'],
        ['🦶🏽', '🧱', '🛖', '🛖', '🛖', '🛖', '🧱', '🧱', '🦶🏽'],
        ['🦶🏽', '🧱', '🛖', '🧱', '🧱', '🧱', '🧱', '🦶🏽', '🧱'],
        ['🦶🏽', '🧱', '🛖', '🧱', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽'],
        ['🦶🏽', '🧱', '🛖', '🛖', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽'],
        ['🦶🏽', '🧱', '🛖', '🧱', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽'],
        ['🦶🏽', '🧱', '🧱', '🧱', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽'],
        ['🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽'],
    ]

    public maxHp = config.barracks.hp
    public hp = this.maxHp

    public tick(): void {}

    public interact(actors: Actor[]) {
        let interactionHappened = false
        for (const actor of actors) {
            if (isHumanActor(actor)) {
                actor.setProfession(new GuardianProfession(this.game))
                interactionHappened = true
            }
        }
        return interactionHappened
    }
}
