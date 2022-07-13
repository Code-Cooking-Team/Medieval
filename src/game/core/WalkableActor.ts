import { Path, Position } from '+game/types'

import { Actor } from './Actor'

export abstract class WalkableActor extends Actor {
    public selectImportance = 4
    public path: Path = null

    public async goTo(position: Position) {
        const pathSearch = await this.game.pf.findPath(this.position, position)
        this.path = pathSearch
        return pathSearch
    }

    public cancelPath() {
        this.path = null
    }

    public move() {
        if (!this.path) return

        const next = this.path.shift()

        if (next) {
            this.position = [next.x, next.y]
        } else {
            this.path = null
        }
    }
}
