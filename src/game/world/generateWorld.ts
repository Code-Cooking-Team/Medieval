import { seededRandom } from '+helpers/random'

import { generateWater } from './generateWater'
import { createTerrainNoise, mix, smooth } from './terrainNoise'
import { ForestTile, MeadowTile, SandTile, StepTile, WaterTile } from './Tile'
import { World } from './World'

export const DEFAULT_WORLD_SEED = 18

const WIDTH = 224
const HEIGHT = 208

type TerrainNoise = ReturnType<typeof createTerrainNoise>

export function generateWorld(seed = DEFAULT_WORLD_SEED) {
    const random = seededRandom(seed)
    const noise = createTerrainNoise(seed)
    const ranges = createRanges(random)
    const cliffs = createCliffs(random)
    const elevations = Array.from({ length: HEIGHT }, (_, y) =>
        Array.from({ length: WIDTH }, (_, x) => {
            const plain = 2.4 + 3.8 * noise.layered(x / 53, y / 53)
            const hills = 1.35 * noise.layered(x / 22 + 8, y / 22)
            return (
                plain +
                hills +
                mountainRelief(x, y, ranges, noise) +
                cliffRelief(x, y, cliffs, noise)
            )
        }),
    )

    const { wet, regions } = generateWater(elevations, seed)
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
            const cover = noise.layered(x / 28 + 9, y / 28 - 12)
            const stone = slope > 1.02 + 0.38 * cover || elevation > 14 + 2.8 * cover
            const detail = noise.layered(x / 6 - 16, y / 6 + 7)
            const [tile, dark, light] = flooded
                ? ([new WaterTile(), 0x3a493d, 0x8d7d58] as const)
                : stone
                  ? ([new StepTile(), 0x383c40, 0x79766e] as const)
                  : shore
                    ? ([new SandTile(), 0x736042, 0xa18c63] as const)
                    : cover > 0.16
                      ? ([new ForestTile(), 0x22340f, 0x415324] as const)
                      : ([new MeadowTile(), 0x2b431b, 0x577938] as const)

            const strata = Math.sin(elevation * 2.1 + detail * 1.6)
            const tint = smooth(
                0.49 + 0.64 * detail + 0.44 * cover + (stone ? 0.15 * strata : 0),
            )
            tile.height = elevation + 0.045 * detail
            tile.color = blendColor(dark, light, tint)
            if (tile instanceof ForestTile)
                tile.treeChance = mix(0.025, 0.085, smooth(cover * 1.6))
            if (tile instanceof StepTile) tile.treeChance = 0
            return tile
        }),
    )
    return new World(tiles, regions)
}

function blendColor(dark: number, light: number, tint: number) {
    const channel = (shift: number) =>
        Math.round(mix((dark >> shift) & 255, (light >> shift) & 255, tint)) << shift
    return channel(16) | channel(8) | channel(0)
}

function createRanges(random: ReturnType<typeof seededRandom>) {
    return Array.from({ length: Math.floor(random(4, 9)) }, (_, index) => {
        const angle = random(0, Math.PI * 2)
        return {
            x: random(24, WIDTH - 24),
            y: random(24, HEIGHT - 24),
            cos: Math.cos(angle),
            sin: Math.sin(angle),
            length: random(17, 36),
            width: random(12, 24),
            height: index === 0 ? random(19, 24) : random(8, 19),
        }
    })
}

function createCliffs(random: ReturnType<typeof seededRandom>) {
    return Array.from({ length: Math.floor(random(2, 8)) }, () => {
        const angle = random(0, Math.PI * 2)
        return {
            x: random(16, WIDTH - 16),
            y: random(16, HEIGHT - 16),
            cos: Math.cos(angle),
            sin: Math.sin(angle),
            span: random(12, 37),
            depth: random(12, 26),
            height: random(4.5, 10),
            phase: random(0, 40),
        }
    })
}

function cliffRelief(
    x: number,
    y: number,
    cliffs: ReturnType<typeof createCliffs>,
    noise: TerrainNoise,
) {
    let relief = 0
    for (const cliff of cliffs) {
        const dx = x - cliff.x
        const dy = y - cliff.y
        const along = dx * cliff.cos + dy * cliff.sin
        const across = -dx * cliff.sin + dy * cliff.cos
        if (Math.abs(along) >= cliff.span || across < -5 || across >= cliff.depth + 5)
            continue

        const edge = across - 4 * noise.layered(along / 12, cliff.phase)
        const face = smooth(edge / 1.5)
        const back = 1 - smooth((edge - 2) / (cliff.depth - 2))
        const ends = 1 - smooth((Math.abs(along) / cliff.span - 0.4) / 0.6)
        relief = Math.max(relief, cliff.height * face * back * ends)
    }
    return relief
}

function mountainRelief(
    x: number,
    y: number,
    ranges: ReturnType<typeof createRanges>,
    noise: TerrainNoise,
) {
    const warpedX = x + 9 * noise.layered(x / 28 + 7, y / 28)
    const warpedY = y + 8 * noise.layered(x / 28, y / 28 - 6)
    const roughness = noise.layered(x / 10, y / 10)
    let relief = 0
    for (const range of ranges) {
        const dx = warpedX - range.x
        const dy = warpedY - range.y
        const along = (dx * range.cos + dy * range.sin) / range.length
        const across = (-dx * range.sin + dy * range.cos) / range.width
        if (Math.abs(along) >= 1.4 || Math.abs(across) >= 1.4) continue

        const crest = smooth(1 - Math.abs(along) / 1.4)
        const spine = Math.max(0, 1 - Math.abs(across + roughness * 0.35))
        const spur =
            0.62 * Math.max(0, 1 - Math.abs(across - 0.48 * Math.sin(along * 4)) * 1.7)
        relief = Math.max(
            relief,
            range.height * crest * Math.max(spine, spur) * (0.9 + 0.32 * roughness),
        )
    }
    return relief
}
