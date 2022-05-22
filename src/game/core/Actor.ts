import { Game } from '../Game'
import { Path, Position } from '../types'
import { ActorStatic } from './ActorStatic'
import { Pathfinding } from './Pathfinding'

export abstract class Actor extends ActorStatic {
    public path: Path = null
    private pf: Pathfinding

    constructor(public game: Game, public position: Position) {
        super(game, position)
        this.pf = new Pathfinding(game)
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
        const path = await this.pf.findPath(this.position, position)
        this.path = path
        return path
    }

    public cancelPath() {
        this.path = null
    }
}
