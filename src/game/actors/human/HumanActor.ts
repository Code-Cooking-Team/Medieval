import { config } from '+config/config'
import { WalkableActor } from '+game/core/WalkableActor'
import { Game } from '+game/Game'
import { ActorType, Position } from '+game/types'
import { random } from '+helpers/basic'
import { addVector } from '+helpers/math'

import { HouseActor } from '../house/HouseActor'

export class HumanActor extends WalkableActor {
    public type = ActorType.Human
    public maxHp = config.human.hp

    constructor(public game: Game, public position: Position) {
        super(game, position)
    }

    public tick(): void {
        super.tick()

        if (this.path) return
        if (Math.random() > config.human.randomWalkChance) return

        const home = this.getHome()
        if (!home) return

        const dis = config.human.walkAroundHomeDistance
        const vector = [random(dis, -dis, true), random(dis, -dis, true)] as Position
        const position = addVector(home.position, vector)

        this.goTo(position)
    }

    public getHome() {
        const houses = this.game.findActorsByType(ActorType.House) as HouseActor[]
        return houses.find((house) => house.residents.includes(this))
    }
}
