import { config } from '+config/config'
import { WalkableActor } from '+game/core/WalkableActor'
import { Game } from '+game/Game'
import { Profession } from '+game/professions/Profession'
import { ActorType, Position } from '+game/types'
import { random } from '+helpers/basic'
import { addVector } from '+helpers/math'

import { HouseActor } from '../house/HouseActor'

export class HumanActor extends WalkableActor {
    public type = ActorType.Human
    public maxHp = config.human.hp
    public profession?: Profession
    public home?: HouseActor

    constructor(public game: Game, public position: Position) {
        super(game, position)
    }

    public tick(): void {
        super.tick()

        if (this.profession) {
            this.profession.tick()
        } else {
            this.walkAround()
        }
    }

    public setHome(home: HouseActor) {
        this.home = home
    }

    public setProfession(profession: Profession) {
        this.profession = profession
    }

    private walkAround() {
        if (this.path) return
        if (Math.random() > config.human.randomWalkChance) return
        if (!this.home) return

        const dis = config.human.walkAroundHomeDistance
        const vector = [random(dis, -dis, true), random(dis, -dis, true)] as Position
        const position = addVector(this.home.position, vector)

        if (this.game.word.getTile(position)) {
            this.goTo(position)
        }
    }
}
