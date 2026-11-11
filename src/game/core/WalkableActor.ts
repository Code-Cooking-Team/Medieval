import { type Path, type PathStep, type Position } from '+game/types'
import { distanceBetweenPoints } from '+helpers/math'

import { Actor, type ActorJSON } from './Actor'

export abstract class WalkableActor extends Actor {
    public selectImportance = 4
    public path: Path = []
    public surface?: string

    public get standingPosition(): PathStep {
        return { x: this.position[0], y: this.position[1], surface: this.surface }
    }

    private pathRequest?: AbortController

    public get isFindingPath() {
        return this.pathRequest !== undefined
    }

    public async setPathTo(position: Position | PathStep, clip = false) {
        this.pathRequest?.abort()
        const request = new AbortController()
        this.pathRequest = request
        try {
            const path = await this.game.pf.findMovementPath(
                this.standingPosition,
                Array.isArray(position) ? { x: position[0], y: position[1] } : position,
                request.signal,
            )
            if (request !== this.pathRequest) return
            if (
                path?.some(
                    (step) =>
                        step.surface && this.game.pf.surfaces.height(step) === undefined,
                )
            )
                return
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

        if (!this.moveStep(next)) this.cancelPath()
    }

    public moveStep(next: PathStep) {
        const position: Position = [next.x, next.y]
        const allowed =
            this.surface || next.surface
                ? this.game.pf.canMove(this.standingPosition, next)
                : this.game.pf.canStep(this.position, position)
        if (!allowed) return false
        this.position = position
        this.surface = next.surface
        return true
    }

    public toJSON(): WalkableActorJSON {
        return {
            ...super.toJSON(),
            path: [...this.path],
            surface: this.surface,
        }
    }

    public fromJSON({ path, surface, ...json }: WalkableActorJSON) {
        super.fromJSON(json)
        this.path = [...path]
        this.surface = surface
    }
}

export interface WalkableActorJSON extends ActorJSON {
    path: Path
    surface?: string
}
