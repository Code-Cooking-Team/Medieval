import { type Path, type Position } from '+game/types'
import { type World } from '+game/world/World'
import { randomArrayItem } from '+helpers/array'

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
const MAX_SEARCH_TICKS = 8

export interface RouteGoal<T> {
    target: T
    positions: Position[]
}

export class Pathfinding {
    private easyStar = new EasyStar.js()
    private pending = new Map<number, { ticksAtFront: number; expire: () => void }>()
    private gridRevision = -1

    constructor(private word: World) {
        this.loadTilesGrid()
    }

    public tick() {
        // EasyStar spends its calculation budget on the oldest unfinished request first.
        let first = this.pending.values().next().value
        if (first?.ticksAtFront === MAX_SEARCH_TICKS) {
            first.expire()
            first = this.pending.values().next().value
        }
        if (first) first.ticksAtFront++
        this.easyStar.calculate()
    }

    public update() {
        if (this.gridRevision !== this.word.tileRevision) this.loadTilesGrid()
    }

    public async findPath(start: Position, end: Position, signal?: AbortSignal) {
        if (signal?.aborted || !this.word.hasTile(start) || !this.word.hasTile(end))
            return
        const [sx, sy] = start
        const [ex, ey] = end

        return new Promise<Path | undefined>((resolve) => {
            let settled = false
            const finish = (path?: Path) => {
                if (settled) return
                settled = true
                if (id !== undefined) this.pending.delete(id)
                signal?.removeEventListener('abort', cancel)
                resolve(path)
            }
            const cancel = () => {
                if (id !== undefined) this.easyStar.cancelPath(id)
                finish()
            }
            const id: number | undefined = this.easyStar.findPath(
                sx,
                sy,
                ex,
                ey,
                (path: FindPathResult) => {
                    path?.shift() // remove start position
                    finish(path ?? undefined)
                },
            )
            // EasyStar returns no ID for trivial or immediately rejected paths.
            if (id !== undefined) {
                this.pending.set(id, {
                    ticksAtFront: 0,
                    expire: () => {
                        if (this.easyStar.cancelPath(id)) finish()
                        // A completed search can still be waiting for its callback.
                        else this.pending.delete(id)
                    },
                })
            }
            signal?.addEventListener('abort', cancel)
        })
    }

    public findIdleStep([x, y]: Position) {
        const neighbors = steps.map(([dx, dy]): Position => [x + dx, y + dy])
        const next = randomArrayItem(
            neighbors.filter((tile) => this.canStep([x, y], tile)),
        )
        return next ? [{ x: next[0], y: next[1] }] : []
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
    // A finite radius keeps both the search and its storage local.
    public findRoute<T>(
        start: Position,
        goals: RouteGoal<T>[],
        inOrder = true,
        radius = Infinity,
    ) {
        const [width, height] = this.word.getSize()
        const left = Math.max(0, start[0] - radius)
        const top = Math.max(0, start[1] - radius)
        const right = Math.min(width - 1, start[0] + radius)
        const bottom = Math.min(height - 1, start[1] + radius)
        const searchWidth = right - left + 1
        const indexOf = ([x, y]: Position) =>
            x < left || x > right || y < top || y > bottom
                ? -1
                : (y - top) * searchWidth + x - left
        const startIndex = indexOf(start)
        if (startIndex === -1) return
        const destinations = new Map<number, { target: T; priority: number }>()
        goals.forEach(({ positions, target }, order) => {
            for (const position of positions) {
                if (!this.word.hasTile(position)?.canWalk) continue
                const index = indexOf(position)
                if (index !== -1 && !destinations.has(index))
                    destinations.set(index, { target, priority: inOrder ? order : 0 })
            }
        })
        if (!destinations.size) return
        const bestPriority = destinations.values().next().value!.priority
        const parents = new Int32Array(searchWidth * (bottom - top + 1)).fill(-1)
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

            const x = left + (index % searchWidth)
            const y = top + Math.floor(index / searchWidth)
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
            path.push({
                x: left + (index % searchWidth),
                y: top + Math.floor(index / searchWidth),
            })
        }
        return { target: best.target, path: path.reverse() }
    }

    private loadTilesGrid() {
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
        this.gridRevision = this.word.tileRevision
    }
}
