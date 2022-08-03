import { Path, Position } from '+game/types'
import { distanceBetweenPoints } from '+helpers'

import { Actor, ActorJSON } from './Actor'

export abstract class WalkableActor extends Actor {
    public selectImportance = 4
    public path: Path = []

    public async setPathTo(position: Position, clip = false) {
        const pathSearch = await this.game.pf.findPath(this.position, position)
        if (pathSearch) {
            this.path = pathSearch
        }
        if (clip) this.clipPath()
        return pathSearch
    }

    public cancelPath() {
        this.path = []
    }

    public clipPath() {
        return this.path.pop()
    }

    public getDistanceToTarget() {
        const target = this.path[this.path.length - 1]
        if (target) {
            return distanceBetweenPoints(this.position, [target.x, target.y])
        }
        return 0
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
