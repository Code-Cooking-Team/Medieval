import { Game } from '../Game'
import { Path, Position } from '../types'
import { ActorStatic } from './ActorStatic'
import { Pathfinding } from './Pathfinding'

export abstract class Actor extends ActorStatic {
    private path: Path = null
    private pf: Pathfinding

    constructor(public game: Game, public position: Position) {
        super(game, position)

        this.pf = new Pathfinding(game.word)
        this.pf.recalculate()
    }

    public tick() {
        this.pf.tick()

        if (this.path) {
            const next = this.path.shift()
            if (next) {
                this.position = [next.x, next.y]
            } else {
                this.path = null
            }
        }
    }

    public async goTo(position: Position) {
        this.path = await this.pf.path(this.position, position)
    }
}
