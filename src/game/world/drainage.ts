import type { Position } from '../types'
import { createTerrainNoise, mix, smooth } from './terrainNoise'

const offsets: Position[] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
]

export function sampleDrainageTerrain(ground: number[][], margin: number, seed: number) {
    const width = ground[0]!.length
    const height = ground.length
    const x = new Float64Array(width * height)
    const y = new Float64Array(x.length)
    const elevations = new Float64Array(x.length)
    const noise = createTerrainNoise(seed)
    for (let row = margin; row < height - margin; row++) {
        for (let col = margin; col < width - margin; col++) {
            const cell = row * width + col
            const edge = Math.min(row, col, width - 1 - col, height - 1 - row) - margin
            const fade = smooth(edge / 31)
            // Sample the real terrain on a smooth irregular mesh. A uniform
            // square graph produces long runs along its eight allowed bearings.
            const sx =
                col +
                fade *
                    (24 * noise.sample(col / 83, row / 83) +
                        6 * noise.sample(col / 33 + 15, row / 33))
            const sy =
                row +
                fade *
                    (24 * noise.sample(col / 83 - 21, row / 83 + 11) +
                        6 * noise.sample(col / 33, row / 33 - 16))
            const left = Math.floor(sx)
            const top = Math.floor(sy)
            const dx = sx - left
            const dy = sy - top
            x[cell] = sx
            y[cell] = sy
            elevations[cell] = mix(
                mix(ground[top]![left]!, ground[top]![left + 1]!, dx),
                mix(ground[top + 1]![left]!, ground[top + 1]![left + 1]!, dx),
                dy,
            )
        }
    }
    return { x, y, elevations }
}

export function drainTerrain(
    elevations: number[][],
    outlet: Position,
    outletLevel: number,
    margin: number,
    sample?: ReturnType<typeof sampleDrainageTerrain>,
) {
    const width = elevations[0]!.length
    const height = elevations.length
    const size = width * height
    const root = outlet[1] * width + outlet[0]
    const downstream = new Int32Array(size).fill(-1)
    const spill = new Float64Array(size)
    const minimum = new Float64Array(size)
    const order: number[] = []
    // Priority-Flood starts at the outlet and visits the lowest available saddle.
    const queue = new FloodQueue(spill)
    spill[root] = outletLevel
    minimum[root] = outletLevel
    downstream[root] = root
    queue.push(root)

    while (queue.size) {
        const cell = queue.pop()
        order.push(cell)
        const x = cell % width
        const y = Math.floor(cell / width)
        for (const [dx, dy] of offsets) {
            const nx = x + dx
            const ny = y + dy
            if (
                nx < margin ||
                nx >= width - margin ||
                ny < margin ||
                ny >= height - margin
            )
                continue

            const next = ny * width + nx
            if (downstream[next] !== -1) continue
            const run = sample
                ? Math.hypot(
                      sample.x[next]! - sample.x[cell]!,
                      sample.y[next]! - sample.y[cell]!,
                  )
                : dx && dy
                  ? Math.SQRT2
                  : 1
            const edgeDistance =
                Math.min(nx, ny, width - 1 - nx, height - 1 - ny) - margin
            const edgePenalty = Math.max(0, 8 - edgeDistance) * 0.14
            downstream[next] = cell
            spill[next] = Math.max(
                (sample?.elevations[next] ?? elevations[ny]![nx]!) + edgePenalty,
                spill[cell]! + 0.002 * run,
            )
            minimum[next] = minimum[cell]! + 0.003 * run
            queue.push(next)
        }
    }

    return { root, order, downstream, minimum }
}

export function accumulateRunoff(
    order: number[],
    downstream: Int32Array,
    inlet: number,
    inflow: number,
) {
    const area = new Float64Array(downstream.length).fill(1)
    area[inlet]! += inflow
    for (let i = order.length - 1; i > 0; i--) {
        const cell = order[i]!
        area[downstream[cell]!]! += area[cell]!
    }
    return area
}

class FloodQueue {
    private cells: number[] = []

    constructor(private levels: Float64Array) {}

    get size() {
        return this.cells.length
    }

    push(cell: number) {
        const cells = this.cells
        let index = cells.length
        cells.push(cell)
        while (index > 0) {
            const parent = (index - 1) >> 1
            if (this.levels[cells[parent]!]! <= this.levels[cell]!) break
            cells[index] = cells[parent]!
            index = parent
        }
        cells[index] = cell
    }

    pop() {
        const cells = this.cells
        const first = cells[0]!
        const last = cells.pop()!
        if (!cells.length) return first

        let index = 0
        while (2 * index + 1 < cells.length) {
            let child = 2 * index + 1
            if (
                child + 1 < cells.length &&
                this.levels[cells[child + 1]!]! < this.levels[cells[child]!]!
            )
                child++
            if (this.levels[last]! <= this.levels[cells[child]!]!) break
            cells[index] = cells[child]!
            index = child
        }
        cells[index] = last
        return first
    }
}
