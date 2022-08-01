import { Path, Position } from '+game/types'
import { distanceBetweenPoints } from '+helpers'

import { Actor, ActorJSON } from './Actor'

export abstract class WalkableActor extends Actor {
    public selectImportance = 4
    public path: Path = []

    public async setPathTo(position: Position) {
        const pathSearch = await this.game.pf.findPath(this.position, position)
        if (pathSearch) {
            this.path = pathSearch
        }
        return pathSearch
    }

    public cancelPath() {
        this.path = []
    }

    public clipPath() {
        this.path.pop()
    }

    public hasPath() {
        return this.path.length > 0
    }

    public move() {
        const next = this.path.shift()

        if (next) {
            this.position = [next.x, next.y]
        }
    }

    public toJSON(): WalkableActorJSON {
        return {
            ...super.toJSON(),
            path: this.path,
        }
    }

    public fromJSON({ path, ...json }: WalkableActorJSON) {
        super.fromJSON(json)
        this.path = path
    }
}

export interface WalkableActorJSON extends ActorJSON {
    path: Path
}
