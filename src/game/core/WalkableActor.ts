import { Path, Position } from '+game/types'

import { StaticActor } from './StaticActor'

export abstract class WalkableActor extends StaticActor {
    public path: Path = null

    public tick() {
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
        const pathSearch = await this.game.pf.findPath(this.position, position)
        this.path = pathSearch
        return pathSearch
    }

    public cancelPath() {
        this.path = null
    }
}
