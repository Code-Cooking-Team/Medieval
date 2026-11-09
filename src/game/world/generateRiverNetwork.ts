import { seededRandom } from '+helpers/random'

import type { Position } from '../types'
import { accumulateRunoff, drainTerrain, sampleDrainageTerrain } from './drainage'
import { flowsNorth, riverCrossing, riverDatum } from './riverRouting'
import { createTerrainNoise, mix, smooth } from './terrainNoise'
import { isWaterfall, SHORE_OVERLAP } from './water'
import type { RiverSample, RiverSection, WaterRegion } from './water'

const MARGIN = 18
const MIN_GRADE = 0.003

type Crossing = ReturnType<typeof riverCrossing>
type Port = Crossing & { axis: 0 | 1; far: boolean }

export function carveDrainageNetwork(
    ground: number[][],
    wet: boolean[][],
    seed: number,
    chunkY: number,
): WaterRegion {
    const width = ground[0]!.length
    const height = ground.length
    const size = width * height
    const layout = seededRandom(seed ^ 0x6bbdb457)
    const threshold = size * layout(0.028, 0.041)
    const axis = layout() < 0.5 ? 0 : 1
    const [inlet, outlet] = riverPorts(ground, seed, chunkY, axis)
    const extent = (axis === 0 ? width : height) - 1
    const upstream = portSection(inlet, extent, MARGIN, true)
    const downstream = portSection(outlet, extent, MARGIN, false)
    const head = upstream.center[1] * width + upstream.center[0]
    const sample = sampleDrainageTerrain(
        ground,
        MARGIN,
        seed ^ Math.imul(chunkY, 0x624d910b),
    )
    const drainage = drainTerrain(
        ground,
        downstream.center,
        downstream.elevation,
        MARGIN,
        sample,
    )
    const area = accumulateRunoff(
        drainage.order,
        drainage.downstream,
        head,
        1.3 * threshold,
    )
    const levels = new Float64Array(size)
    const strongest = new Int32Array(size).fill(-1)

    // A minimum downstream grade keeps cut channels flowing toward their outlet.
    for (const cell of drainage.order) {
        if (area[cell]! < threshold) continue
        const parent = drainage.downstream[cell]!
        if (cell === head) drainage.minimum[cell] = upstream.elevation
        if (parent !== cell) {
            drainage.minimum[cell] = Math.max(
                drainage.minimum[cell]!,
                drainage.minimum[parent]! + MIN_GRADE,
            )
            const best = strongest[parent]!
            if (best < 0 || area[cell]! > area[best]!) strongest[parent] = cell
        }
        levels[cell] = Math.max(drainage.minimum[cell]!, sample.elevations[cell]! - 0.42)
    }
    levels[head] = upstream.elevation
    levels[drainage.root] = downstream.elevation
    for (let i = drainage.order.length - 1; i > 0; i--) {
        const cell = drainage.order[i]!
        if (area[cell]! < threshold) continue
        const parent = drainage.downstream[cell]!
        if (parent === head || parent === drainage.root) continue
        levels[parent] = Math.max(
            drainage.minimum[parent]!,
            Math.min(levels[parent]!, levels[cell]! - MIN_GRADE),
        )
    }

    const sections = new Map<number, RiverSection>()
    for (const cell of drainage.order) {
        if (area[cell]! < threshold) continue
        if (cell === head) {
            sections.set(cell, upstream)
            continue
        }
        if (cell === drainage.root) {
            sections.set(cell, downstream)
            continue
        }

        const parent = drainage.downstream[cell]!
        const lower = drainage.downstream[parent]!
        const higher = strongest[cell]!
        const upstream2 = higher >= 0 ? strongest[higher]! : -1
        // Smooth the shared graph vertices, including those at confluences.
        const neighbors = [upstream2, higher, cell, parent, lower]
        const weights = [1, 2, 4, 2, 1]
        let x = 0
        let y = 0
        let total = 0
        for (let i = 0; i < neighbors.length; i++) {
            const node = neighbors[i]!
            if (node < 0) continue
            const weight = weights[i]!
            x += sample.x[node]! * weight
            y += sample.y[node]! * weight
            total += weight
        }

        const rise = Math.max(0, levels[cell]! - levels[lower]!)
        const terrain = sample.elevations[cell]!
        const cx = Math.round(sample.x[cell]!)
        const cy = Math.round(sample.y[cell]!)
        const relief = Math.max(
            Math.abs(ground[cy - 6]![cx]! - terrain),
            Math.abs(ground[cy + 6]![cx]! - terrain),
            Math.abs(ground[cy]![cx - 6]! - terrain),
            Math.abs(ground[cy]![cx + 6]! - terrain),
        )
        const floodplain = (1 - smooth(relief / 2)) * (1 - smooth(rise / 0.55))
        const discharge = Math.sqrt(area[cell]! / threshold)
        const headwater = smooth((area[cell]! / threshold - 1) / 0.55)
        const halfWidth = mix(
            0.85,
            Math.min(5.2, 1 + discharge * (0.42 + 0.72 * floodplain)),
            headwater,
        )
        sections.set(cell, {
            center: [x / total, y / total],
            halfWidth,
            elevation: levels[cell]!,
        })
    }

    const raster = new ChannelRaster(ground, wet, seed ^ 0x202d1b91)
    for (const [cell, section] of sections) {
        const next = sections.get(drainage.downstream[cell]!)!
        if (section !== next) raster.addSegment(section, next)
    }
    for (const [port, isInlet] of [
        [inlet, true],
        [outlet, false],
    ] as const) {
        const edge = portSection(port, extent, 0, isInlet)
        const tangent = portSection(port, extent, 2, isInlet)
        const inside = portSection(port, extent, MARGIN, isInlet)
        raster.addSegment(edge, tangent)
        raster.addSegment(tangent, inside)
    }
    addBackwaters(raster, ground, sections, drainage.downstream, seed, chunkY)
    // Only the agreed crossings may reach the shared edges.
    raster.clearBoundary()
    raster.setBoundary(inlet, extent)
    raster.setBoundary(outlet, extent)
    return { kind: 'drainage', samples: raster.carve() }
}

function addBackwaters(
    raster: ChannelRaster,
    ground: number[][],
    sections: Map<number, RiverSection>,
    downstream: Int32Array,
    seed: number,
    chunkY: number,
) {
    const random = seededRandom(seed ^ 0x5f4b2d93 ^ Math.imul(chunkY, 0x6d8e215b))
    const width = ground[0]!.length
    const height = ground.length
    const candidates: {
        channel: RiverSection
        shore: Position
        direction: Position
        score: number
    }[] = []

    for (const [cell, channel] of sections) {
        const next = sections.get(downstream[cell]!)!
        const [x, y] = channel.center
        const dx = next.center[0] - x
        const dy = next.center[1] - y
        const run = Math.hypot(dx, dy)
        if (
            run < 0.25 ||
            channel.halfWidth < 1.7 ||
            channel.elevation - next.elevation > 0.12 * run ||
            Math.min(x, y, width - 1 - x, height - 1 - y) < 32
        )
            continue

        const direction: Position = [dx / run, dy / run]
        for (const side of [-1, 1]) {
            const shore: Position = [
                x - side * 10 * direction[1],
                y + side * 10 * direction[0],
            ]
            const levels = [
                ground[Math.round(shore[1])]![Math.round(shore[0])]!,
                ground[Math.round(shore[1] + 5 * direction[1])]![
                    Math.round(shore[0] + 5 * direction[0])
                ]!,
                ground[Math.round(shore[1] - 5 * direction[1])]![
                    Math.round(shore[0] - 5 * direction[0])
                ]!,
            ]
            const low = Math.min(...levels)
            const high = Math.max(...levels)
            if (
                low > channel.elevation + 1.8 ||
                high - low > 1.5 ||
                raster.isWet(shore) ||
                raster.isWet([
                    shore[0] - side * 4 * direction[1],
                    shore[1] + side * 4 * direction[0],
                ])
            )
                continue

            candidates.push({
                channel,
                shore,
                direction,
                score:
                    Math.abs(low - channel.elevation - 0.3) +
                    0.75 * (high - low) +
                    random(0, 0.35),
            })
        }
    }

    candidates.sort((a, b) => a.score - b.score)
    const placed: Position[] = []
    const area = width * height
    const count = Math.max(1, Math.round((area / (224 * 208)) * random(0.8, 1.05)))
    for (const { channel, shore, direction } of candidates) {
        if (placed.some(([x, y]) => Math.hypot(x - shore[0], y - shore[1]) < 56)) continue

        const elevation = channel.elevation
        const inlet: RiverSection = {
            ...channel,
            halfWidth: Math.min(channel.halfWidth, 2.5),
        }
        const shoulder: RiverSection = {
            center: [
                mix(channel.center[0], shore[0], 0.55),
                mix(channel.center[1], shore[1], 0.55),
            ],
            elevation,
            halfWidth: random(2.4, 3.5),
        }
        const basin: RiverSection = {
            center: shore,
            elevation,
            halfWidth: random(5.8, 8.1),
        }
        const reach = random(6, 11)
        const lobe: RiverSection = {
            center: [shore[0] + direction[0] * reach, shore[1] + direction[1] * reach],
            elevation,
            halfWidth: random(3.4, 5.9),
        }
        raster.addSegment(inlet, shoulder, true)
        raster.addSegment(shoulder, basin, true)
        raster.addSegment(basin, lobe, true)
        placed.push(shore)
        if (placed.length === count) break
    }
}

function riverPorts(
    ground: number[][],
    seed: number,
    chunkY: number,
    axis: 0 | 1,
): [Port, Port] {
    const crossSize = axis === 0 ? ground.length : ground[0]!.length
    const min = MARGIN + 8
    const max = crossSize - 1 - min
    if (axis === 1) {
        const north: Port = {
            ...riverCrossing(seed, chunkY, 0, min, max),
            axis,
            far: false,
        }
        const south: Port = {
            ...riverCrossing(seed, chunkY + 1, 0, min, max),
            axis,
            far: true,
        }
        return flowsNorth(seed) ? [south, north] : [north, south]
    }

    const random = seededRandom(seed ^ 0x5191c291 ^ Math.imul(chunkY, 0x4af17823))
    const far = random() < 0.5
    const edge = far ? ground[0]!.length - 1 : 0
    let mouth = Math.round(random(min, max))
    for (let i = 0; i < 12; i++) {
        const candidate = Math.round(random(min, max))
        if (ground[candidate]![edge]! < ground[mouth]![edge]!) mouth = candidate
    }
    const end = Math.min(
        ground[mouth]![edge]! - 0.42,
        riverDatum(seed, chunkY + mouth / (crossSize - 1)) - 0.5,
    )
    const source = Math.round(random(min, max))
    const opposite = ground[0]!.length - 1 - edge
    return [
        {
            axis,
            far: !far,
            cross: source,
            tangent: 0,
            halfWidth: 2.1,
            elevation: Math.max(end + 2.8, ground[source]![opposite]! - 0.42),
        },
        { axis, far, cross: mouth, tangent: 0, halfWidth: 3.1, elevation: end },
    ]
}

function portSection(
    port: Port,
    extent: number,
    depth: number,
    inlet: boolean,
): RiverSection {
    const along = port.far ? extent - depth : depth
    const cross = port.cross + Math.min(2, depth) * port.tangent * (port.far ? -1 : 1)
    return {
        center: port.axis === 0 ? [along, cross] : [cross, along],
        halfWidth: port.halfWidth,
        elevation: port.elevation + depth * (inlet ? -0.018 : 0.018),
    }
}

class ChannelRaster {
    private readonly width: number
    private readonly height: number
    private readonly distance: Float64Array
    private readonly widths: Float64Array
    private readonly levels: Float64Array
    private readonly falling: Uint8Array
    private readonly shallow: Uint8Array
    private readonly noise: ReturnType<typeof createTerrainNoise>

    constructor(
        private ground: number[][],
        private wet: boolean[][],
        seed: number,
    ) {
        this.width = ground[0]!.length
        this.height = ground.length
        const size = this.width * this.height
        this.distance = new Float64Array(size).fill(Infinity)
        this.widths = new Float64Array(size)
        this.levels = new Float64Array(size)
        this.falling = new Uint8Array(size)
        this.shallow = new Uint8Array(size)
        this.noise = createTerrainNoise(seed)
    }

    isWet([x, y]: Position) {
        const cell = Math.round(y) * this.width + Math.round(x)
        return this.distance[cell]! < this.widths[cell]!
    }

    addSegment(a: RiverSection, b: RiverSection, shallow = false) {
        const [x, y] = a.center
        const [endX, endY] = b.center
        const dx = endX - x
        const dy = endY - y
        const lengthSquared = dx * dx + dy * dy
        if (lengthSquared === 0) return

        const drop = isWaterfall(a, b)
        const fallReach = 0.85 / Math.sqrt(lengthSquared)
        const radius = Math.max(a.halfWidth, b.halfWidth) + 7
        const right = Math.min(this.width - 1, Math.ceil(Math.max(x, endX) + radius))
        const bottom = Math.min(this.height - 1, Math.ceil(Math.max(y, endY) + radius))
        for (
            let row = Math.max(0, Math.floor(Math.min(y, endY) - radius));
            row <= bottom;
            row++
        ) {
            for (
                let col = Math.max(0, Math.floor(Math.min(x, endX) - radius));
                col <= right;
                col++
            ) {
                const along = ((col - x) * dx + (row - y) * dy) / lengthSquared
                const t = Math.max(0, Math.min(1, along))
                const distance = Math.hypot(col - (x + t * dx), row - (y + t * dy))
                const halfWidth = mix(a.halfWidth, b.halfWidth, t)
                const cell = row * this.width + col
                if (
                    drop &&
                    along >= -fallReach &&
                    along <= 1 + fallReach &&
                    distance < halfWidth - 0.35
                )
                    this.falling[cell] = 1
                if (distance - halfWidth >= this.distance[cell]! - this.widths[cell]!)
                    continue
                this.distance[cell] = distance
                this.widths[cell] = halfWidth
                this.levels[cell] = mix(a.elevation, b.elevation, t)
                this.shallow[cell] = Number(shallow)
            }
        }
    }

    clearBoundary() {
        this.distance.fill(Infinity, 0, this.width)
        this.distance.fill(Infinity, (this.height - 1) * this.width)
        for (let y = 1; y < this.height - 1; y++) {
            this.distance[y * this.width] = Infinity
            this.distance[(y + 1) * this.width - 1] = Infinity
        }
    }

    setBoundary(port: Port, extent: number) {
        const edge = port.far ? extent : 0
        const count = port.axis === 0 ? this.height : this.width
        for (let cross = 0; cross < count; cross++) {
            const cell =
                port.axis === 0 ? cross * this.width + edge : edge * this.width + cross
            this.distance[cell] = Math.abs(cross - port.cross)
            this.widths[cell] = port.halfWidth
            this.levels[cell] = port.elevation
            this.falling[cell] = 0
            this.shallow[cell] = 0
        }
    }

    carve() {
        const samples: RiverSample[] = []
        for (let cell = 0; cell < this.distance.length; cell++) {
            const halfWidth = this.widths[cell]!
            const distance = this.distance[cell]! - halfWidth
            if (distance >= 7) continue

            const x = cell % this.width
            const y = Math.floor(cell / this.width)
            const level = this.levels[cell]!
            const ground = this.ground[y]![x]!
            const edge = Math.min(x, y, this.width - 1 - x, this.height - 1 - y)
            const erosion =
                1.65 * this.noise.sample(x / 5, y / 5) +
                0.8 * this.noise.sample(x / 2.1 + 9, y / 2.1 - 15)
            const bank =
                distance +
                smooth(edge / 6) *
                    (1 - smooth(Math.abs(distance) / 4.5)) *
                    smooth(halfWidth / 2) *
                    erosion
            const bed = level - (this.shallow[cell] ? 0.42 : 0.68 + 0.055 * halfWidth)
            const bankTop = Math.max(level + 0.48, Math.min(ground, level + 1.25))
            const slope = mix(bed, bankTop, smooth((bank + 0.85) / 2.1))
            const elevation = mix(slope, ground, smooth((bank - 3.5) / 3.5))
            this.ground[y]![x] = elevation
            if (bank <= SHORE_OVERLAP && elevation < level) this.wet[y]![x] = true
            if (bank <= SHORE_OVERLAP + 0.8) {
                samples.push(
                    this.falling[cell] && elevation < level && bank < 0
                        ? [x, y, level, true]
                        : [x, y, level],
                )
            }
        }
        return samples
    }
}
