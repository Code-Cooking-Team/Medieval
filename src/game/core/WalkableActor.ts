import { type Path, type Position } from '+game/types'
import { distanceBetweenPoints } from '+helpers/math'

import { Actor, type ActorJSON } from './Actor'

export abstract class WalkableActor extends Actor {
    public selectImportance = 4
    public path: Path = []

    private pathRequest?: AbortController

    public get isFindingPath() {
        return this.pathRequest !== undefined
    }

    public async setPathTo(position: Position, clip = false) {
        this.pathRequest?.abort()
        const request = new AbortController()
        this.pathRequest = request
        try {
            const path = await this.game.pf.findPath(
                this.position,
                position,
                request.signal,
            )
            if (request !== this.pathRequest) return
            if (path) {
                this.path = path
                if (clip) this.clipPath()
            }
            return path
        } finally {
            if (request === this.pathRequest) this.pathRequest = undefined
        }
    }

    public cancelPath() {
        this.pathRequest?.abort()
        this.pathRequest = undefined
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
        if (this.isFindingPath) return
        const next = this.path.shift()

        if (!next) return

        const position: Position = [next.x, next.y]
        if (!this.game.pf.canStep(this.position, position)) {
            this.cancelPath()
            return
        }
        this.position = position
    }

    public toJSON(): WalkableActorJSON {
        return {
            ...super.toJSON(),
            path: [...this.path],
        }
    }

    public fromJSON({ path, ...json }: WalkableActorJSON) {
        super.fromJSON(json)
        this.path = [...path]
    }
}

export interface WalkableActorJSON extends ActorJSON {
    path: Path
}
