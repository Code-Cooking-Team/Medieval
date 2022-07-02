import { config } from '+config/config'
import { WalkableActor } from '+game/core/WalkableActor'
import { Game } from '+game/Game'
import { ActorType, Position } from '+game/types'

export class GuardianActor extends WalkableActor {
    public type = ActorType.Guardian
    public maxHp = config.guardian.hp

    constructor(public game: Game, public position: Position) {
        super(game, position)
    }

    tick(): void {
        super.tick()
    }
}
