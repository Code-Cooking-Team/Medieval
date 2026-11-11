import { WalkableActor } from '+game/core/WalkableActor'
import { ActorType, Path, Position } from '+game/types'
import { distanceBetweenPoints, random } from '+helpers'

const threatRange = 10
const fleeDistance = 10
const escapeSearchSteps = 14
const neighbors = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
] as const

interface EscapeTile {
    position: Position
    steps: number
    previous?: EscapeTile
}

export class DeerActor extends WalkableActor {
    public type = ActorType.Deer
    public isFleeing = false

    private grazeTicks = random(14, 26, true)
    private stepTicks = 0
    private escapeRetryTicks = 0

    public tick() {
        super.tick()

        const threat = this.game
            .findActorsByPosition(this.position, threatRange)
            .filter(({ type }) => type === ActorType.Human || type === ActorType.Boar)
            .sort(
                (a, b) =>
                    distanceBetweenPoints(this.position, a.position) -
                    distanceBetweenPoints(this.position, b.position),
            )[0]

        if (threat) {
            if (!this.isFleeing) {
                this.cancelPath()
                this.isFleeing = true
                this.stepTicks = 0
                this.escapeRetryTicks = 0
            }

            if (!this.hasPath() && this.escapeRetryTicks-- <= 0) {
                this.path = this.findEscapePath(threat.position)
                this.escapeRetryTicks = this.hasPath() ? 0 : 4
            }
        }

        if (this.hasPath()) {
            if (this.isFleeing) {
                this.move()
            } else if (this.stepTicks > 0) {
                this.stepTicks--
            } else {
                this.move()
                this.stepTicks = 1
            }
            return
        }

        if (this.isFindingPath || threat) return
        this.isFleeing = false
        if (--this.grazeTicks > 0) return

        this.grazeTicks = random(14, 26, true)
        this.path = this.game.pf.findIdleStep(this.position)
    }

    private canWalkTo(destination: Position) {
        return (
            this.game.world.hasTile(destination) &&
            this.game.world.getTile(destination).canWalk
        )
    }

    private findEscapePath(threat: Position): Path {
        const start: EscapeTile = { position: this.position, steps: 0 }
        const queue = [start]
        const visited = new Set<string>([this.position.join(',')])
        let best: EscapeTile | undefined
        let bestScore = distanceBetweenPoints(this.position, threat)

        // Search reachable tiles in every direction, with a fixed budget per attempt.
        // Keep the route found here so an escape never adds work to the shared queue.
        for (let i = 0; i < queue.length; i++) {
            const tile = queue[i]!
            if (tile.steps >= escapeSearchSteps) continue
            const [x, y] = tile.position

            for (const [dx, dy] of neighbors) {
                const position: Position = [x + dx, y + dy]
                const key = position.join(',')
                if (visited.has(key) || !this.canWalkTo(position)) continue
                if (
                    dx &&
                    dy &&
                    (!this.canWalkTo([x + dx, y]) || !this.canWalkTo([x, y + dy]))
                ) {
                    continue
                }

                visited.add(key)
                const next = { position, steps: tile.steps + 1, previous: tile }
                queue.push(next)
                const distance = distanceBetweenPoints(this.position, position)
                if (distance > fleeDistance + 0.5) continue

                const score = distanceBetweenPoints(position, threat)
                if (score > bestScore) {
                    best = next
                    bestScore = score
                }
            }
        }

        const path: Path = []
        while (best?.previous) {
            const [x, y] = best.position
            path.push({ x, y })
            best = best.previous
        }
        return path.reverse()
    }
}
