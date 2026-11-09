import { seededRandom } from '+helpers/random'

import type { Position } from '../types'
import { ForestTile, MeadowTile, SandTile, StepTile, WaterTile } from './Tile'
import type { RiverSection, WaterRegion } from './water'
import { World } from './World'

export const DEFAULT_WORLD_SEED = 18

const WIDTH = 112
const HEIGHT = 104

const smooth = (value: number) => {
    const t = Math.max(0, Math.min(1, value))
    return t * t * (3 - 2 * t)
}

const mix = (start: number, end: number, t: number) => start + (end - start) * t

export function generateWorld(seed = DEFAULT_WORLD_SEED) {
    const random = seededRandom(seed)
    const valleyPhase = random(0, Math.PI * 2)
    const widthPhase = random(0, Math.PI * 2)
    const ridge = HEIGHT * random(0.33, 0.43)
    const valleyWidth = random(7, 10)
    const peaks = [
        {
            x: WIDTH * random(0.21, 0.33),
            y: HEIGHT * random(0.39, 0.56),
            width: random(9, 15),
            length: random(9, 13),
            height: random(12, 17),
        },
        {
            x: WIDTH * random(0.72, 0.83),
            y: HEIGHT * random(0.43, 0.57),
            width: random(9, 13),
            length: random(10, 15),
            height: random(8, 13),
        },
    ]

    const valley = (y: number) =>
        WIDTH * 0.51 + 5 * Math.sin(y / 15 + valleyPhase) + 2 * Math.sin(y / 8)
    const elevations = Array.from({ length: HEIGHT }, (_, y) =>
        Array.from({ length: WIDTH }, (_, x) => {
            const distance = Math.abs(x - valley(y))
            const cliff = ridge + 3 * Math.sin(x / 18 + valleyPhase)
            const plateau = 4.8 * smooth((cliff - y) / (0.8 + distance / 30))
            const hills = 0.65 * Math.sin(x / 8 + valleyPhase) * Math.cos(y / 11)
            const slope = (1 - y / (HEIGHT - 1)) * 3.5
            const foothills = smooth(distance / valleyWidth) * (1.2 + hills)
            const mountains = peaks.reduce((height, peak) => {
                const dx = (x - peak.x + 2 * Math.sin(y / 6)) / peak.width
                const dy = (y - peak.y + 2 * Math.sin(x / 6)) / peak.length
                return height + peak.height * Math.exp(-dx * dx - dy * dy)
            }, 0)
            return (
                slope + plateau + foothills + mountains * smooth(distance / valleyWidth)
            )
        }),
    )

    const wet = elevations.map((row) => row.map(() => false))
    const sections = carveRiver(elevations, wet, Math.round(valley(0)), widthPhase)
    const waterRegions: WaterRegion[] = [
        { kind: 'river', sections },
        carveLake(
            elevations,
            wet,
            [WIDTH * random(0.16, 0.24), HEIGHT * random(0.66, 0.78)],
            random(5, 8),
            random(4, 6),
            random(0, Math.PI * 2),
        ),
        carveLake(
            elevations,
            wet,
            [WIDTH * random(0.76, 0.84), HEIGHT * random(0.13, 0.21)],
            random(5, 8),
            random(4, 6),
            random(0, Math.PI * 2),
        ),
    ]

    const coverPhase = random(0, Math.PI * 2)
    const tiles = elevations.map((row, y) =>
        row.map((elevation, x) => {
            const flooded = wet[y]![x]!
            const slope = Math.max(
                Math.abs(elevation - (row[x - 1] ?? elevation)),
                Math.abs(elevation - (row[x + 1] ?? elevation)),
                Math.abs(elevation - (elevations[y - 1]?.[x] ?? elevation)),
                Math.abs(elevation - (elevations[y + 1]?.[x] ?? elevation)),
            )
            const shore =
                wet[y]![x - 1] || wet[y]![x + 1] || wet[y - 1]?.[x] || wet[y + 1]?.[x]
            const woodland = Math.sin(x / 9 + coverPhase) * Math.cos(y / 10) > 0.55
            const [tile, color] = flooded
                ? ([new WaterTile(), 0x665a36] as const)
                : slope > 1.05 || elevation > 8.6
                  ? ([new StepTile(), 0x5c5955] as const)
                  : shore
                    ? ([new SandTile(), 0x80704c] as const)
                    : woodland
                      ? ([new ForestTile(), 0x2b360a] as const)
                      : ([new MeadowTile(), 0x355123] as const)

            // Constructor defaults are for hand-authored tile maps.
            tile.height = elevation + random(-0.035, 0.035)
            const tint = Math.round(random(-5, 5))
            tile.color = color + tint * 0x010101
            return tile
        }),
    )
    return new World(tiles, waterRegions)
}

function carveRiver(
    elevations: number[][],
    wet: boolean[][],
    sourceX: number,
    phase: number,
) {
    let x = sourceX
    let surface = Infinity
    return elevations.map((row, y): RiverSection => {
        // Follow the lowest adjacent point downstream. When it rises, cut through it.
        x = [x, x - 1, x + 1].reduce((lowest, candidate) =>
            (row[candidate] ?? Infinity) < row[lowest]! ? candidate : lowest,
        )
        surface = Math.min(row[x]! + 0.22, surface - 0.018)
        const halfWidth = 2.5 + 0.75 * Math.sin(y / 11 + phase) + 0.4 * Math.sin(y / 5)
        for (
            let bankX = Math.max(0, Math.floor(x - halfWidth - 2));
            bankX <= Math.min(row.length - 1, Math.ceil(x + halfWidth + 2));
            bankX++
        ) {
            const distance = Math.abs(bankX - x)
            const bank = smooth((distance - halfWidth - 0.4) / 1.6)
            row[bankX] = mix(surface - 0.58, Math.max(row[bankX]!, surface + 0.45), bank)
            wet[y]![bankX] = distance <= halfWidth
        }
        return { center: [x, y], halfWidth, elevation: surface }
    })
}

function carveLake(
    elevations: number[][],
    wet: boolean[][],
    [cx, cy]: Position,
    radiusX: number,
    radiusY: number,
    phase: number,
): WaterRegion {
    const elevation = elevations[Math.round(cy)]![Math.round(cx)]! - 0.45
    const tiles: Position[] = []
    elevations.forEach((row, y) =>
        row.forEach((ground, x) => {
            const dx = (x - cx) / radiusX
            const dy = (y - cy) / radiusY
            const distance = Math.hypot(dx, dy)
            if (distance > 1.8) return
            const shore = 1 + 0.12 * Math.sin(3 * Math.atan2(dy, dx) + phase)
            const rim = smooth((distance - shore) / 0.48)
            row[x] = mix(elevation - 0.62, Math.max(ground, elevation + 0.45), rim)
            if (distance <= shore) {
                wet[y]![x] = true
                tiles.push([x, y])
            }
        }),
    )
    return { kind: 'lake', tiles, elevation }
}
