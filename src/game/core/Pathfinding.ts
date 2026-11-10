import { type Path, type Position } from '+game/types'
import { type World } from '+game/world/World'

import EasyStar from 'easystarjs'

type FindPathResult =
    | {
          x: number
          y: number
      }[]
    | null

const steps: Position[] = [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
]

const entryDirections = [
    EasyStar.TOP,
    EasyStar.LEFT,
    EasyStar.RIGHT,
    EasyStar.BOTTOM,
    EasyStar.TOP_LEFT,
    EasyStar.TOP_RIGHT,
    EasyStar.BOTTOM_LEFT,
    EasyStar.BOTTOM_RIGHT,
]
const MAX_STEP_HEIGHT = 1.1

export interface RouteGoal<T> {
    target: T
    positions: Position[]
}

export class Pathfinding {
    private easyStar = new EasyStar.js()
    private instanceId?: number

    constructor(private word: World) {
        this.loadTilesGrid()
    }

    public tick() {
        this.easyStar.calculate()
    }

    public update() {
        this.loadTilesGrid()
    }

    public findPath([sx, sy]: Position, [ex, ey]: Position) {
        return new Promise<Path | undefined>((resolve, reject) => {
            try {
                const instanceId = this.easyStar.findPath(
                    sx,
                    sy,
                    ex,
                    ey,
                    (path: FindPathResult) => {
                        this.instanceId = undefined

                        if (!path) {
                            return resolve(undefined)
                        }

                        path.shift() // remove start position
                        resolve(path)
                    },
                )
                this.instanceId = instanceId
            } catch (error) {
                reject(error)
            }
        })
    }

    public canStep([x, y]: Position, [nextX, nextY]: Position) {
        const dx = Math.abs(x - nextX)
        const dy = Math.abs(y - nextY)
        if (dx > 1 || dy > 1 || dx + dy === 0) return false

        const from = this.word.hasTile([x, y])
        const to = this.word.hasTile([nextX, nextY])
        if (!from || !to?.canWalk) return false

        const rise = Math.abs(to.height - from.height)
        if (!dx || !dy) return rise <= MAX_STEP_HEIGHT
        if (rise > MAX_STEP_HEIGHT * Math.SQRT2) return false

        const horizontal = this.word.hasTile([nextX, y])
        const vertical = this.word.hasTile([x, nextY])
        if (!horizontal?.canWalk || !vertical?.canWalk) return false
        // A diagonal needs a walkable way around the slope within the same square.
        return (
            Math.max(
                Math.abs(horizontal.height - from.height),
                Math.abs(to.height - horizontal.height),
            ) <= MAX_STEP_HEIGHT ||
            Math.max(
                Math.abs(vertical.height - from.height),
                Math.abs(to.height - vertical.height),
            ) <= MAX_STEP_HEIGHT
        )
    }

    // Search once for all approaches. Goals are ordered by priority, and the
    // closest approach wins among positions belonging to the same goal.
    public findRoute<T>(start: Position, goals: RouteGoal<T>[], inOrder = true) {
        const [width, height] = this.word.getSize()
        const indexOf = ([x, y]: Position) => y * width + x
        const destinations = new Map<number, { target: T; priority: number }>()
        goals.forEach(({ positions, target }, order) => {
            for (const position of positions) {
                if (!this.word.hasTile(position)?.canWalk) continue
                const index = indexOf(position)
                if (!destinations.has(index))
                    destinations.set(index, { target, priority: inOrder ? order : 0 })
            }
        })
        if (!destinations.size) return
        const bestPriority = destinations.values().next().value!.priority
        const startIndex = indexOf(start)
        const parents = new Int32Array(width * height).fill(-1)
        parents[startIndex] = startIndex
        const frontier = [startIndex]
        let best: { index: number; priority: number; target: T } | undefined

        for (let i = 0; i < frontier.length; i++) {
            const index = frontier[i]!
            const destination = destinations.get(index)
            if (destination && (!best || destination.priority < best.priority)) {
                best = { index, ...destination }
                if (best.priority === bestPriority) break
            }

            const x = index % width
            const y = Math.floor(index / width)
            for (const [dx, dy] of steps) {
                const next: Position = [x + dx, y + dy]
                const nextIndex = indexOf(next)
                if (parents[nextIndex] !== -1 || !this.canStep([x, y], next)) continue
                parents[nextIndex] = index
                frontier.push(nextIndex)
            }
        }

        if (!best) return
        const path: Path = []
        for (let index = best.index; index !== startIndex; index = parents[index]!) {
            path.push({ x: index % width, y: Math.floor(index / width) })
        }
        return { target: best.target, path: path.reverse() }
    }

    public cancelPath() {
        if (this.isFinding()) this.easyStar.cancelPath(this.instanceId!)
        this.instanceId = undefined
    }

    public isFinding() {
        return this.instanceId !== undefined
    }

    public loadTilesGrid() {
        const tiles = this.word.tiles.map((row) =>
            row.map((tile) => (tile.canWalk ? 1 : 0)),
        )

        this.easyStar.removeAllAdditionalPointCosts()
        this.easyStar.removeAllDirectionalConditions()

        this.word.forEachTile((tile, [x, y]) => {
            if (tile.walkCost) this.easyStar.setAdditionalPointCost(x, y, tile.walkCost)
            if (!tile.canWalk) return
            const allowed = entryDirections.filter((_, i) => {
                const [dx, dy] = steps[i]!
                return this.canStep([x + dx, y + dy], [x, y])
            })
            if (allowed.length !== entryDirections.length) {
                this.easyStar.setDirectionalCondition(x, y, allowed)
            }
        })

        this.easyStar.setGrid(tiles)
        this.easyStar.setAcceptableTiles([1])
        this.easyStar.enableDiagonals()
        // A diagonal line of wall tiles must block movement between its segments.
        this.easyStar.disableCornerCutting()
        this.easyStar.setIterationsPerCalculation(1000)
    }
}
