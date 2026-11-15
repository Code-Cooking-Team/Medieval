import { getCliffFaceSurfaces } from '+game/world/cliffFaceSurfaces'
import { type Path, type PathStep, type Position } from '+game/types'
import { getCliffShelves } from '+game/world/cliffShelves'
import { SMALL_ROCK_TOP } from '+game/world/rockPlacement'
import { RockTile } from '+game/world/Tile'
import { type World } from '+game/world/World'
import { randomArrayItem } from '+helpers/array'

import EasyStar from 'easystarjs'

import {
    MAX_STEP_HEIGHT,
    type StandingSurface,
    StandingSurfaces,
} from './StandingSurfaces'

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
const MAX_SEARCH_TICKS = 8
const MAX_LAYERED_EXPANSIONS = 8000

export const rockSurfaceId = (position: Position) => `rock:${position.join(',')}`

export interface RouteGoal<T> {
    target: T
    positions: Position[]
}

export class Pathfinding {
    private easyStar = new EasyStar.js()
    private pending = new Map<number, { ticksAtFront: number; expire: () => void }>()
    private gridRevision = -1
    private lowCliffClearance = new Set<string>()

    public readonly surfaces: StandingSurfaces

    constructor(private word: World) {
        this.surfaces = new StandingSurfaces(word)
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
        if (signal?.aborted || !this.word.hasTile(start) || !this.canStandOnGround(end))
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

    public canMove(from: PathStep, to: PathStep) {
        if (!to.surface && !this.canStandOnGround([to.x, to.y])) return false
        return from.surface || to.surface
            ? this.surfaces.canStep(from, to)
            : this.canStep([from.x, from.y], [to.x, to.y])
    }

    // Preserve ordinary ground routes, but allow a raised route to bridge a
    // gap if the terrain planner cannot reach the destination.
    public async findMovementPath(start: PathStep, end: PathStep, signal?: AbortSignal) {
        if (!start.surface && !end.surface) {
            const ground = await this.findPath([start.x, start.y], [end.x, end.y], signal)
            if (ground || !this.surfaces.all().next().value) return ground
        }
        if (
            signal?.aborted ||
            this.surfaces.height(start) === undefined ||
            this.surfaces.height(end) === undefined ||
            (!end.surface && !this.canStandOnGround([end.x, end.y]))
        )
            return

        const key = (step: PathStep) => step.surface ?? `${step.x},${step.y}`
        const heuristic = (step: PathStep) =>
            Math.max(Math.abs(end.x - step.x), Math.abs(end.y - step.y))
        type Entry = { step: PathStep; cost: number; parent?: Entry }
        const startEntry = { step: start, cost: 0 }
        const best = new Map([[key(start), 0]])
        const buckets = new Map<number, Entry[]>([[heuristic(start), [startEntry]]])
        let score = heuristic(start)
        let expansions = 0
        while (buckets.size && expansions < MAX_LAYERED_EXPANSIONS) {
            const bucket = buckets.get(score)
            if (!bucket) {
                score++
                continue
            }
            const current = bucket.pop()!
            if (!bucket.length) buckets.delete(score)
            const { step, cost } = current
            if (best.get(key(step)) !== cost) continue
            expansions++
            if (key(step) === key(end)) {
                const path: Path = []
                for (let entry = current; entry.parent; entry = entry.parent)
                    path.push(entry.step)
                return path.reverse()
            }
            const neighbors = [...this.surfaces.neighbors(step)]
            if (!step.surface) {
                for (const [dx, dy] of steps)
                    neighbors.push({ x: step.x + dx, y: step.y + dy })
            }
            for (const next of neighbors) {
                const nextCost =
                    cost +
                    1 +
                    (next.surface
                        ? 0
                        : (this.word.hasTile([next.x, next.y])?.walkCost ?? 0))
                const nextKey = key(next)
                if (
                    (best.get(nextKey) ?? Infinity) <= nextCost ||
                    !this.canMove(step, next)
                )
                    continue
                best.set(nextKey, nextCost)
                const priority = nextCost + heuristic(next)
                const entry = { step: next, cost: nextCost, parent: current }
                const pending = buckets.get(priority)
                if (pending) pending.push(entry)
                else buckets.set(priority, [entry])
            }
        }
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
        if (!from || !to || !this.canStandOnGround([nextX, nextY])) return false

        const rise = Math.abs(to.height - from.height)
        if (!dx || !dy) return rise <= MAX_STEP_HEIGHT
        if (rise > MAX_STEP_HEIGHT * Math.SQRT2) return false

        const horizontal = this.word.hasTile([nextX, y])
        const vertical = this.word.hasTile([x, nextY])
        if (!horizontal || !vertical ||
            !this.canStandOnGround([nextX, y]) || !this.canStandOnGround([x, nextY])) return false
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
                if (!this.canStandOnGround(position)) continue
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

    public canStandOnGround(position: Position) {
        return !!this.word.hasTile(position)?.canWalk &&
            !this.lowCliffClearance.has(position.join(','))
    }

    private loadTilesGrid() {
        this.easyStar.removeAllAdditionalPointCosts()
        this.easyStar.removeAllDirectionalConditions()

        const rocks: StandingSurface[] = []
        this.word.forEachTile((tile, [x, y]) => {
            if (tile instanceof RockTile && tile.rockSize === 1) {
                const ground = steps
                    .slice(0, 4)
                    .map(([dx, dy]): Position => [x + dx, y + dy])
                rocks.push({
                    id: rockSurfaceId([x, y]),
                    position: [x, y],
                    height: tile.height + SMALL_ROCK_TOP,
                    ground,
                    links: [],
                    halfWidth: 0.22,
                })
            }
        })

        this.surfaces.replace('rocks', rocks)
        const shelves = getCliffShelves(this.word).flatMap(({ surfaces }) => surfaces)
        const occupied = new Set([...rocks, ...shelves].map(({ position }) => position.join(',')))
        const cliffs = [...shelves, ...getCliffFaceSurfaces(this.word, occupied)]
        this.surfaces.replace('cliffs', cliffs)
        this.lowCliffClearance.clear()
        for (const { position, height } of cliffs) {
            const clearance = height - this.word.getTile(position).height
            if (clearance > 0 && clearance < 2.4) {
                this.lowCliffClearance.add(position.join(','))
            }
        }
        const tiles = this.word.tiles.map((row, y) =>
            row.map((_, x) => this.canStandOnGround([x, y]) ? 1 : 0),
        )
        this.word.forEachTile((tile, [x, y]) => {
            if (tile.walkCost) this.easyStar.setAdditionalPointCost(x, y, tile.walkCost)
            if (!this.canStandOnGround([x, y])) return
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
