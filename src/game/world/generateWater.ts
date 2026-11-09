import { seededRandom } from '+helpers/random'

import type { Position } from '../types'
import { createTerrainNoise, mix, smooth } from './terrainNoise'
import { expandWaterFootprint, SHORE_OVERLAP } from './water'
import type { RiverSection, WaterRegion } from './water'

type Random = ReturnType<typeof seededRandom>
type Noise = ReturnType<typeof createTerrainNoise>

type RiverRoute = {
    axis: 'x' | 'y'
    farEdge: boolean
    through: boolean
    lower: number
    upper: number
}

type LakeShape = ReturnType<typeof lakeShape>

export function generateWater(elevations: number[][], seed: number) {
    const random = seededRandom(seed ^ 0x6bbdb457)
    const noise = createTerrainNoise(seed ^ 0x260538b5)
    const wet = elevations.map((row) => row.map(() => false))
    const riverCount = Math.floor(random(1, 4))
    const axis = random() < 0.5 ? 'x' : 'y'
    const crossSize = axis === 'x' ? elevations.length : elevations[0]!.length
    const localRiver = riverCount === 3 ? Math.floor(random(0, riverCount)) : -1
    const regions: WaterRegion[] = []
    let edge = 0
    for (let i = 0; i < riverCount; i++) {
        const nextEdge =
            i + 1 === riverCount
                ? crossSize
                : Math.round(((i + 1) * crossSize) / riverCount + random(-12, 12))
        const route: RiverRoute = {
            axis,
            farEdge: random() < 0.5,
            through: i !== localRiver,
            lower: edge + 15,
            upper: nextEdge - 16,
        }
        regions.push(carveRiver(elevations, wet, route, random, noise, i))
        edge = nextEdge
    }

    const lakeCount = Math.floor(random(1, 4))
    for (let i = 0; i < lakeCount; i++) {
        const shape = lakeShape(random)
        const site = findLakeSite(elevations, wet, shape, random)
        if (site) regions.push(carveLake(elevations, wet, site, shape, noise))
    }
    return { wet, regions }
}

function carveRiver(
    elevations: number[][],
    wet: boolean[][],
    { axis, farEdge, through, lower, upper }: RiverRoute,
    random: Random,
    noise: Noise,
    index: number,
): WaterRegion {
    const alongX = axis === 'x'
    const alongSize = alongX ? elevations[0]!.length : elevations.length
    const length = through ? alongSize - 1 : Math.floor(random(55, 92))
    const sourceGuide = Math.round(random(lower, upper))
    const mouth = random(lower, upper)
    const bend = random(6, 14)
    const phase = random(0, 25)
    const width = random(2.7, 4.1)
    const point = (along: number, cross: number): Position =>
        alongX ? [along, cross] : [cross, along]
    const ground = (along: number, cross: number) => {
        const [x, y] = point(along, cross)
        return elevations[y]![x]!
    }
    const fromEdge = (depth: number) => (farEdge ? alongSize - 1 - depth : depth)

    const start = fromEdge(length)
    const source = [sourceGuide, sourceGuide - 8, sourceGuide + 8].reduce(
        (best, candidate) => {
            const inCatchment = candidate >= lower && candidate <= upper
            return inCatchment && ground(start, candidate) > ground(start, best) + 0.65
                ? candidate
                : best
        },
    )
    const startHeight = ground(start, source) - 0.48
    const endHeight = Math.min(
        ground(fromEdge(0), Math.round(mouth)) - 0.45,
        startHeight - 1,
        random(-0.7, 0.4),
    )
    let cross = source
    let elevation = Infinity
    const sections: RiverSection[] = []
    for (let step = 0; step <= length; step++) {
        const depth = length - step
        const along = fromEdge(depth)
        const t = step / length
        const center =
            mix(source, mouth, t) +
            bend * Math.sin(Math.PI * t) * noise.sample(step / 17, phase)
        const target = Math.max(lower, Math.min(upper, center))
        const cost = (candidate: number) =>
            0.16 * (candidate - target) ** 2 + 0.22 * ground(along, candidate)
        cross = [cross, cross - 1, cross + 1].reduce((best, candidate) =>
            candidate >= lower && candidate <= upper && cost(candidate) < cost(best)
                ? candidate
                : best,
        )

        const grade = mix(startHeight, endHeight, t * t * t)
        elevation = Math.min(
            elevation - (through ? 0.004 : 0.009),
            grade + 0.17 * noise.sample(step / 10, phase + 5),
            ground(along, cross) - 0.48,
        )
        const halfWidth = channelWidth(step, length, width, phase, noise, !through)
        sections.push({ center: point(along, cross), halfWidth, elevation })
    }

    const axisIndex = alongX ? 0 : 1
    let tributary: RiverSection[] | undefined
    for (let attempt = 0; attempt < 3 && !tributary; attempt++) {
        tributary = traceTributary(
            sections,
            axisIndex,
            lower,
            upper,
            random,
            noise,
            ground,
        )
    }
    carveChannel(elevations, wet, sections, axisIndex, noise, index, !through)
    if (tributary)
        carveChannel(elevations, wet, tributary, axisIndex, noise, index + 17, true)
    return {
        kind: 'river',
        axis,
        sections,
        tributaries: tributary ? [tributary] : undefined,
    }
}

function channelWidth(
    step: number,
    length: number,
    width: number,
    phase: number,
    noise: Noise,
    spring: boolean,
) {
    const pools = smooth(0.5 + 1.05 * noise.sample(step / 19, phase))
    const riffles = noise.layered(step / 7, phase + 11)
    const widening = mix(0.7, 1.22, step / length)
    const channel = width * widening * mix(0.52, 1.8, pools) + 0.45 * riffles
    if (!spring) return channel

    const bowl = 3.4 * Math.sin(Math.PI * Math.min(1, step / 16))
    return mix(0.25, channel + bowl, smooth(step / 8))
}

function traceTributary(
    sections: RiverSection[],
    axis: 0 | 1,
    lower: number,
    upper: number,
    random: Random,
    noise: Noise,
    ground: (along: number, cross: number) => number,
): RiverSection[] | undefined {
    const cross = axis === 0 ? 1 : 0
    const join = Math.floor(random(0.58, 0.79) * sections.length)
    const length = Math.floor(random(0.7, 0.94) * join)
    const startIndex = join - length
    const source = sections[startIndex]!
    const distance = random(22, Math.min(49, length * 1.05))
    const possible = [-1, 1]
        .map((side) => {
            const limit = side < 0 ? lower : upper
            const offset =
                side * Math.min(distance, Math.abs(limit - source.center[cross]))
            const height = ground(
                source.center[axis],
                Math.round(source.center[cross] + offset),
            )
            return { offset, height }
        })
        .filter(
            ({ offset, height }) =>
                Math.abs(offset) >= 15 && height > source.elevation + 0.1,
        )
    if (!possible.length) return

    const { offset, height } = possible[Math.floor(random(0, possible.length))]!
    const width = random(1.1, 2.2)
    const phase = random(0, 25)
    let previous = Infinity
    return sections.slice(startIndex, join + 1).map((parent, step): RiverSection => {
        const t = step / length
        const lateral =
            parent.center[cross] +
            offset * (1 - t) +
            4 * Math.sin(Math.PI * t) * noise.sample(step / 14, phase)
        const coordinate = Math.round(Math.max(lower, Math.min(upper, lateral)))
        const center = [...parent.center] as Position
        center[cross] = coordinate
        const halfWidth = channelWidth(step, length, width, phase, noise, true)
        const grade = mix(height - 0.42, sections[join]!.elevation, t)
        const elevation =
            Math.abs(coordinate - parent.center[cross]) <=
            halfWidth + parent.halfWidth + 2 * SHORE_OVERLAP + 2
                ? parent.elevation
                : Math.max(
                      parent.elevation,
                      Math.min(
                          previous - 0.009,
                          grade,
                          ground(center[axis], coordinate) - 0.42,
                      ),
                  )
        previous = elevation
        return { center, halfWidth, elevation }
    })
}

function carveChannel(
    elevations: number[][],
    wet: boolean[][],
    sections: RiverSection[],
    axis: 0 | 1,
    noise: Noise,
    phase: number,
    spring: boolean,
) {
    const cross = axis === 0 ? 1 : 0
    const crossSize = axis === 0 ? elevations.length : elevations[0]!.length
    for (const [step, { center, halfWidth, elevation }] of sections.entries()) {
        const sourceFade = spring ? smooth(step / 7) : 1
        const carve = spring ? smooth(step / 4) : 1
        const apron = 8
        for (
            let bank = Math.max(0, Math.floor(center[cross] - halfWidth - apron));
            bank <= Math.min(crossSize - 1, Math.ceil(center[cross] + halfWidth + apron));
            bank++
        ) {
            const x = axis === 0 ? center[0] : bank
            const y = axis === 0 ? bank : center[1]
            const row = elevations[y]!
            const ground = row[x]!
            const distance = Math.abs(bank - center[cross]) - halfWidth
            const side = bank < center[cross] ? -1 : 1
            const erosion = noise.layered(step / 8, phase + side * 13)
            const bed = mix(
                elevation + 0.55,
                elevation - 1.03 - 0.33 * erosion,
                sourceFade,
            )
            const rim = Math.max(
                elevation + 0.54,
                Math.min(ground, elevation + 1.1 + 0.45 * erosion),
            )
            const bankHeight = mix(
                bed,
                rim,
                smooth((distance + 0.72 + 0.37 * erosion) / (2.15 + 0.46 * erosion)),
            )
            const terrain = mix(
                bankHeight,
                ground,
                1 - carve * (1 - smooth((distance - 2.65) / (apron - 2.65))),
            )
            const contained =
                distance >= 1.4 && distance <= 3.2
                    ? Math.max(terrain, elevation + 0.36)
                    : terrain
            row[x] = wet[y]![x] ? Math.min(ground, contained) : contained
            if (row[x]! <= elevation && distance < 1.5) wet[y]![x] = true
        }
    }
}

function lakeShape(random: Random) {
    const radiusX = random(8, 17)
    const radiusY = random(7, 14)
    const angle = random(0, Math.PI * 2)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
        radiusX,
        radiusY,
        cos,
        sin,
        phase: random(0, Math.PI * 2),
        extentX: Math.ceil(1.68 * Math.hypot(radiusX * cos, radiusY * sin)),
        extentY: Math.ceil(1.68 * Math.hypot(radiusX * sin, radiusY * cos)),
    }
}

function findLakeSite(
    elevations: number[][],
    wet: boolean[][],
    shape: LakeShape,
    random: Random,
): Position | undefined {
    const padX = shape.extentX + 10
    const padY = shape.extentY + 10
    let site: Position | undefined
    let bestSlope = Infinity
    for (let attempt = 0; attempt < 32; attempt++) {
        const x = Math.floor(random(padX, elevations[0]!.length - padX))
        const y = Math.floor(random(padY, elevations.length - padY))
        const hasWater = wet
            .slice(y - padY, y + padY + 1)
            .some((row) => row.slice(x - padX, x + padX + 1).includes(true))
        if (hasWater) continue

        const center = elevations[y]![x]!
        const slope = Math.max(
            Math.abs(center - elevations[y]![x - 5]!),
            Math.abs(center - elevations[y]![x + 5]!),
            Math.abs(center - elevations[y - 5]![x]!),
            Math.abs(center - elevations[y + 5]![x]!),
        )
        if (slope < bestSlope) {
            bestSlope = slope
            site = [x, y]
        }
    }
    return site
}

function carveLake(
    elevations: number[][],
    wet: boolean[][],
    [cx, cy]: Position,
    { radiusX, radiusY, cos, sin, phase, extentX, extentY }: LakeShape,
    noise: Noise,
): WaterRegion {
    const nearbyHeights = [elevations[cy]![cx]!]
    for (const offset of [-1, 1]) {
        nearbyHeights.push(
            elevations[cy]![cx + Math.round(offset * radiusX * 0.7)]!,
            elevations[cy + Math.round(offset * radiusY * 0.7)]![cx]!,
        )
    }
    const elevation = Math.min(...nearbyHeights) - 0.38
    const tiles: Position[] = []
    const distanceToBank = (x: number, y: number) => {
        const dx = x - cx
        const dy = y - cy
        const u = (dx * cos + dy * sin) / radiusX
        const v = (-dx * sin + dy * cos) / radiusY
        const distance = Math.hypot(u, v)
        const angle = Math.atan2(v, u)
        // Low frequencies create peninsulas and bays. Local noise roughens their edges.
        const shore =
            1 +
            0.25 * Math.sin(2 * angle + phase) +
            0.22 * Math.cos(3 * angle - 2 * phase) +
            0.1 * Math.sin(5 * angle + phase) +
            0.09 * noise.layered(x / 4, y / 4 + 21)
        const radius = distance ? Math.hypot(dx, dy) / distance : radiusX
        return (distance - shore) * radius
    }
    const padX = extentX + 8
    const padY = extentY + 8
    for (let y = cy - padY; y <= cy + padY; y++) {
        const row = elevations[y]!
        for (let x = cx - padX; x <= cx + padX; x++) {
            const bankDistance = distanceToBank(x, y)
            if (bankDistance >= 8) continue

            const ground = row[x]!
            const bank = mix(
                elevation - 1.03,
                Math.max(ground, elevation + 0.52),
                smooth((bankDistance + 1.05) / 2.35),
            )
            row[x] = mix(bank, ground, smooth((bankDistance - 4.2) / 3.8))
            if (bankDistance <= 1.3 && row[x]! <= elevation) {
                wet[y]![x] = true
                tiles.push([x, y])
            }
        }
    }
    // The padded mesh covers whole cells. Raise the outer bank at every ground
    // vertex those cells can touch so waves can't reappear beyond the rim.
    const width = elevations[0]!.length
    const inner = expandWaterFootprint(tiles, width, elevations.length, SHORE_OVERLAP - 1)
    for (const cell of expandWaterFootprint(
        tiles,
        width,
        elevations.length,
        SHORE_OVERLAP + 1,
    )) {
        const x = cell % width
        const y = Math.floor(cell / width)
        if (!inner.has(cell) || distanceToBank(x, y) >= 1.3)
            elevations[y]![x] = Math.max(elevations[y]![x]!, elevation + 0.38)
    }
    return { kind: 'lake', tiles, elevation }
}
