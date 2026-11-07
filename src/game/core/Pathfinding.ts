import { Path, Position } from '+game/types'
import { World } from '+game/world/World'

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
        return (
            this.word.hasTile([nextX, nextY])?.canWalk &&
            (x === nextX ||
                y === nextY ||
                (this.word.hasTile([nextX, y])?.canWalk &&
                    this.word.hasTile([x, nextY])?.canWalk))
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

        this.word.forEachTile((tile, [x, y]) => {
            if (!tile.walkCost) return
            this.easyStar.setAdditionalPointCost(x, y, tile.walkCost)
        })

        this.easyStar.setGrid(tiles)
        this.easyStar.setAcceptableTiles([1])
        this.easyStar.enableDiagonals()
        // A diagonal line of wall tiles must block movement between its segments.
        this.easyStar.disableCornerCutting()
        this.easyStar.setIterationsPerCalculation(1000)
    }
}
