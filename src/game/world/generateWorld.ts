import { seededRandom } from '+helpers/random'

import { generateWater } from './generateWater'
import { riverDatum } from './riverRouting'
import { createTerrainNoise, mix, smooth } from './terrainNoise'
import { createTerrainRegions } from './terrainRegions'
import { ForestTile, MeadowTile, SandTile, StepTile, WaterTile } from './Tile'
import { World } from './World'

export const DEFAULT_WORLD_SEED = 18

const WORLD_TEST_SCALE = 2
const WIDTH = 224 * WORLD_TEST_SCALE
const HEIGHT = 208 * WORLD_TEST_SCALE

type TerrainNoise = ReturnType<typeof createTerrainNoise>

export function generateWorld(seed = DEFAULT_WORLD_SEED, chunkY = 0) {
    // The outer rows of neighboring chunks represent the same world coordinates.
    const stride = HEIGHT - 1
    const offsetY = chunkY * stride
    const noise = createTerrainNoise(seed)
    const mountainNoise = createTerrainNoise(seed ^ 0x13ed40ad)
    // Include worlds at both extremes while still allowing any intermediate coverage.
    const mountainCoverage = smooth(seededRandom(seed ^ 0x57903ab7)(-0.15, 1.15))
    const regionalRelief = createTerrainRegions(seed, mix(0.85, 1.55, mountainCoverage))
    const features = [chunkY - 1, chunkY, chunkY + 1].map((chunk) => {
        const random = seededRandom(seed ^ Math.imul(chunk, 0x373cb179))
        return {
            ranges: createRanges(random, chunk * stride, mountainCoverage),
            cliffs: createCliffs(random, chunk * stride),
        }
    })
    const ranges = features.flatMap(({ ranges }) => ranges)
    const cliffs = features.flatMap(({ cliffs }) => cliffs)
    const elevations = Array.from({ length: HEIGHT }, (_, y) => {
        const worldY = y + offsetY
        const datum = 2.4 + riverDatum(seed, worldY / stride)
        return Array.from({ length: WIDTH }, (_, x) => {
            const plain =
                datum +
                regionalRelief(x, worldY) +
                2.1 * noise.layered(x / 53, worldY / 53)
            const hills = 1.35 * noise.layered(x / 22 + 8, worldY / 22)
            const lowland = plain + hills + cliffRelief(x, worldY, cliffs, noise)
            const mountainField =
                mountainCoverage + 0.36 * mountainNoise.layered(x / 145, worldY / 145)
            const mountainRegion = smooth((mountainField - 0.38) / 0.24)
            if (mountainRegion === 0) return lowland

            const upland =
                4 + 10 * smooth(0.5 + mountainNoise.layered(x / 38, worldY / 38))
            return (
                lowland +
                mountainRegion * (upland + mountainRelief(x, worldY, ranges, noise))
            )
        })
    })

    const { wet, regions } = generateWater(elevations, seed, chunkY)
    const tiles = elevations.map((row, y) => {
        const seam = y === 0 || y === HEIGHT - 1
        const worldY = y + offsetY
        const datum = riverDatum(seed, worldY / stride)
        return row.map((elevation, x) => {
            const flooded = wet[y]![x]!
            const localElevation = elevation - datum
            const slope = Math.max(
                Math.abs(elevation - (row[x - 1] ?? elevation)),
                Math.abs(elevation - (row[x + 1] ?? elevation)),
                seam ? 0 : Math.abs(elevation - elevations[y - 1]![x]!),
                seam ? 0 : Math.abs(elevation - elevations[y + 1]![x]!),
            )
            const shore =
                wet[y]![x - 1] ||
                wet[y]![x + 1] ||
                (!seam && (wet[y - 1]![x] || wet[y + 1]![x]))
            const cover = noise.layered(x / 28 + 9, worldY / 28 - 12)
            const summit = smooth((localElevation - 23 - 3 * cover) / 8)
            const stone = slope > 1.02 + 0.38 * cover || summit > 0.45
            const grayRock = Math.max(summit, smooth((slope - 1.25) / 1.1))
            const detail = noise.layered(x / 6 - 16, worldY / 6 + 7)
            const [tile, dark, light] = flooded
                ? ([new WaterTile(), 0x3a493d, 0x8d7d58] as const)
                : stone
                  ? ([new StepTile(), 0x383c40, 0x79766e] as const)
                  : shore
                    ? ([new SandTile(), 0x736042, 0xa18c63] as const)
                    : cover > 0.16
                      ? ([new ForestTile(), 0x22340f, 0x415324] as const)
                      : ([new MeadowTile(), 0x2b431b, 0x577938] as const)

            const strata = Math.sin(localElevation * 2.1 + detail * 1.6)
            const tint = smooth(
                0.49 + 0.64 * detail + 0.44 * cover + (stone ? 0.15 * strata : 0),
            )
            tile.height = elevation + 0.045 * detail
            const color = blendColor(dark, light, tint)
            tile.color =
                tile instanceof StepTile
                    ? blendColor(color, blendColor(0x343b44, 0x81878e, tint), grayRock)
                    : color
            if (tile instanceof ForestTile)
                tile.treeChance = mix(0.025, 0.085, smooth(cover * 1.6))
            if (tile instanceof StepTile) tile.treeChance = 0
            return tile
        })
    })
    return new World(tiles, regions, seed)
}

function blendColor(dark: number, light: number, tint: number) {
    const channel = (shift: number) =>
        Math.round(mix((dark >> shift) & 255, (light >> shift) & 255, tint)) << shift
    return channel(16) | channel(8) | channel(0)
}

function createRanges(
    random: ReturnType<typeof seededRandom>,
    offsetY: number,
    mountainCoverage: number,
) {
    const count = Math.floor(random(4, 9) * WORLD_TEST_SCALE)
    const footprint = mix(1, 1.45, mountainCoverage)
    const elevation = mix(1, 1.5, mountainCoverage)
    return Array.from(
        { length: Math.round(count * mix(1, 1.75, mountainCoverage)) },
        (_, index) => {
            const angle = random(0, Math.PI * 2)
            return {
                x: random(24, WIDTH - 24),
                y: offsetY + random(24, HEIGHT - 24),
                cos: Math.cos(angle),
                sin: Math.sin(angle),
                length: random(17, 36) * footprint,
                width: random(12, 24) * footprint,
                height: (index === 0 ? random(19, 24) : random(8, 19)) * elevation,
            }
        },
    )
}

function createCliffs(random: ReturnType<typeof seededRandom>, offsetY: number) {
    return Array.from({ length: Math.floor(random(2, 8) * WORLD_TEST_SCALE) }, () => {
        const angle = random(0, Math.PI * 2)
        return {
            x: random(16, WIDTH - 16),
            y: offsetY + random(16, HEIGHT - 16),
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

        const ridge = across + roughness * 0.35 + 0.14 * Math.sin(along * 5)
        const shoulder = smooth(1 - Math.abs(along) / 1.4) * smooth(1 - Math.abs(ridge))
        const summit =
            Math.max(0, 1 - 0.95 * Math.abs(along)) *
            Math.max(0, 1 - 2.1 * Math.abs(ridge))
        const spur =
            smooth(1 - Math.abs(along) / 1.4) *
            Math.max(0, 1 - 1.7 * Math.abs(across - 0.48 * Math.sin(along * 4)))
        relief = Math.max(
            relief,
            range.height *
                (0.53 * shoulder + 0.72 * summit + 0.18 * spur) *
                (0.9 + 0.32 * roughness),
        )
    }
    return relief
}
