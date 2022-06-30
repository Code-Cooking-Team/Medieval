import { config } from '+config/config'
import { Pathfinding } from '+game/core/Pathfinding'
import { Game } from '+game/Game'
import { ActorType, Position } from '+game/types'
import { maxValue } from '+helpers/math'
import { assert } from '+helpers/quality'

import { WalkableActor } from '../../core/WalkableActor'
import { TreeActor } from '../tree/TreeActor'

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
