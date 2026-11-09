import { config } from '+config'
import { Path, Position } from '+game/types'
import { addPosition, distanceBetweenPoints, isSamePosition } from '+helpers'

import { Actor, ActorJSON } from './Actor'
import { neighborSteps } from './Pathfinding'

const idleSpreadRadius = 3

export abstract class WalkableActor extends Actor {
    public selectImportance = 4
    public path: Path = []

    private pathRequest = 0
    private blockedStep?: Position
    private blockedAttempts = 0
    private attemptedMove = false
    public isFindingPath = false

    public tick() {
        super.tick()
        this.attemptedMove = false
    }

    public async setPathTo(position: Position, clip = false) {
        const request = ++this.pathRequest
        this.isFindingPath = true
        try {
            const path = await this.game.pf.findPath(this.position, position)
            if (request !== this.pathRequest) return
            if (path) {
                this.path = path
                if (clip) this.clipPath()
            }
            return path
        } finally {
            if (request === this.pathRequest) this.isFindingPath = false
        }
    }

    public cancelPath() {
        this.pathRequest++
        this.isFindingPath = false
        this.path = []
        this.blockedStep = undefined
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

    public move(path = this.path) {
        const next = path[0]

        if (!next) return 'idle'

        this.attemptedMove = true
        const position: Position = [next.x, next.y]
        if (!this.game.pf.canStep(this.position, position)) {
            this.blockedStep = undefined
            if (path === this.path) this.cancelPath()
            return 'invalid'
        }
        const { unitCollision: mode, collisionWaitAttempts } = config.movement
        if (
            (mode === 'Overlap + sidestep' || mode === 'Alternate') &&
            this.game.isUnitOccupying(this.position, this) &&
            this.stepAside(path, position)
        ) {
            this.blockedStep = undefined
            return 'moved'
        }
        if (mode !== 'Off' && this.game.isUnitOccupying(position, this)) {
            if (mode === 'Wait') {
                this.blockedStep = undefined
                return 'blocked'
            }
            const attempts = this.countBlockedAttempt(position)
            if (mode === 'Detour') {
                if (attempts >= collisionWaitAttempts) {
                    this.blockedAttempts = 0
                    this.retryBlockedStep(path, position)
                }
                return 'blocked'
            }
            if (attempts <= collisionWaitAttempts) return 'blocked'
            if (
                mode === 'Alternate' &&
                this.retryBlockedStep(
                    path,
                    position,
                    config.movement.alternateDetourExtraPercent,
                )
            ) {
                this.blockedStep = undefined
                return 'blocked'
            }
        }

        this.blockedStep = undefined
        path.shift()
        this.position = position
        return 'moved'
    }

    public isIdleForSpreading() {
        return !this.isFindingPath && !this.hasPath() && !this.attemptedMove
    }

    public spreadOut() {
        if (!this.game.isUnitOccupying(this.position, this)) return

        const step = this.game.pf.findStepToFreeTile(
            this.position,
            idleSpreadRadius,
            (position) => !this.game.isUnitOccupying(position, this),
        )
        if (step) this.position = step
    }

    private countBlockedAttempt(position: Position) {
        if (!this.blockedStep || !isSamePosition(this.blockedStep, position)) {
            this.blockedStep = position
            this.blockedAttempts = 0
        }
        return ++this.blockedAttempts
    }

    private retryBlockedStep(path: Path, position: Position, extraPercent = Infinity) {
        const { x, y } = path[path.length - 1]!
        if (isSamePosition(position, [x, y])) return false

        const detour = this.game.findUnitDetour(this, [x, y])
        if (!detour?.length || detour.length * 100 > path.length * (100 + extraPercent))
            return false

        path.splice(0, path.length, ...detour)
        return true
    }

    private stepAside(path: Path, next: Position) {
        const directionX = next[0] - this.position[0]
        const directionY = next[1] - this.position[1]
        const options = neighborSteps
            .filter(([dx, dy]) => dx * directionX + dy * directionY >= 0)
            .map((step) => addPosition(this.position, step))
            .filter(
                (position) =>
                    this.game.pf.canStep(this.position, position) &&
                    !this.game.isUnitOccupying(position, this) &&
                    Math.abs(position[0] - next[0]) <= 1 &&
                    Math.abs(position[1] - next[1]) <= 1 &&
                    this.game.pf.canStep(position, next),
            )
        if (!options.length) return false
        const position = options[Math.floor(Math.random() * options.length)]!

        if (isSamePosition(position, next)) path.shift()
        this.position = position
        return true
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
