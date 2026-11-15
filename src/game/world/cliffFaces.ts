import { cliffElevation, shelfProfiles } from '+game/world/cliffProfile'
import { createTerrainNoise } from '+game/world/terrainNoise'
import { TileType } from '+game/world/types'
import { type World } from '+game/world/World'
import { seededRandom } from '+helpers/random'

const spacing = 4
const minSlope = 0.85

// Cross sections run from the crest toward the foot. Each profile describes
// the width and exposed depth of a different fractured rock face.
const profiles = [
    [
        [0.52, 0],
        [0.86, 0.48],
        [1, 0.62],
        [0.72, 0.32],
        [0.55, 0],
    ],
    [
        [0.58, 0],
        [0.95, 0.32],
        [0.82, 0.54],
        [1, 0.55],
        [0.64, 0],
    ],
    [
        [0.48, 0],
        [0.76, 0.52],
        [0.9, 0.43],
        [0.91, 0.28],
        [0.6, 0],
    ],
] as const

const fragmentProfile = [
    [0.56, 0],
    [0.95, 0.36],
    [1.2, 0.72],
    [0.76, 0.43],
    [0.48, 0],
] as const

export type CliffVertex = [x: number, height: number, z: number]

export function forEachCliffFace(
    world: World,
    visit: (vertices: CliffVertex[], shelf: boolean, triangles: number[]) => void,
) {
    const [width, height] = world.getSize()
    const fractureNoise = createTerrainNoise((world.seed ?? 0) ^ 0x17b54f)
    const elevation = (x: number, y: number) => cliffElevation(world, x, y)

    for (let top = 5; top < height - 5; top += spacing) {
        for (let left = 5; left < width - 5; left += spacing) {
            const random = seededRandom(
                (world.seed ?? 0) ^ Math.imul(left, 73856093) ^ Math.imul(top, 19349663),
            )
            const x = left + Math.floor(random(0, Math.min(spacing, width - 5 - left)))
            const y = top + Math.floor(random(0, Math.min(spacing, height - 5 - top)))
            const tile = world.tiles[y]![x]!
            if (tile.type !== TileType.Step) continue
            const dx = (elevation(x - 1, y) - elevation(x + 1, y)) / 2
            const dz = (elevation(x, y - 1) - elevation(x, y + 1)) / 2
            const slope = Math.hypot(dx, dz)
            if (slope < minSlope) continue
            const downhillX = dx / slope
            const downhillZ = dz / slope
            const above = elevation(x - downhillX, y - downhillZ)
            const below = elevation(x + downhillX, y + downhillZ)
            if (above < tile.height + 0.75 || below > tile.height - 0.75) continue

            // Find the ends of the same face, stopping where the slope breaks.
            const trace = (direction: number) => {
                let previous = tile.height
                for (let distance = 1; distance <= 3; distance++) {
                    const next = elevation(
                        x + downhillX * direction * distance,
                        y + downhillZ * direction * distance,
                    )
                    if ((next - previous) * -direction < 0.45) return distance - 1
                    previous = next
                }
                return 3
            }
            const uphill = trace(-1)
            const downhill = trace(1)
            if (uphill + downhill < 3) continue

            const sideRock = (side: number) =>
                world.tiles[Math.round(y - downhillX * side)]![
                    Math.round(x + downhillZ * side)
                ]!.type === TileType.Step
            const broadFace = uphill + downhill >= 4 && sideRock(-2) && sideRock(2)
            if (!broadFace && random() < 0.68) continue

            const ribProfile = profiles[Math.floor(random(0, profiles.length))]!
            const halfWidth = random(0.72, 1.16)
            const vertices: CliffVertex[] = []
            const triangles: number[] = []
            const lean = random(-0.24, 0.24)
            // Local density controls where isolated shelves and groups can start.
            const shelfDensity = fractureNoise.sample(x / 14, y / 14)
            const shelf = random() < 0.095 + shelfDensity * 0.085
            const crestHeight = elevation(x - downhillX * uphill, y - downhillZ * uphill)
            const behindCrest = elevation(
                x - downhillX * (uphill + 1),
                y - downhillZ * (uphill + 1),
            )
            // Some shelves reach the rim where the ground levels off above the face.
            const rimShelf =
                shelf &&
                uphill < 3 &&
                Math.abs(behindCrest - crestHeight) < 0.3 &&
                random() < 0.8
            const fragment = !shelf && (!broadFace || random() < 0.38)
            const profile = shelf
                ? shelfProfiles[Math.floor(random(0, shelfProfiles.length))]!
                : fragment
                  ? fragmentProfile
                  : ribProfile
            const reach = shelf ? random(0.68, 1.25) : random(0.8, 1.1)
            const length = fragment ? random(0.27, 0.47) : shelf ? random(0.42, 0.72) : 1
            const fragmentShift = fragment ? random(-0.45, 0.45) : 0
            const rimCenter = -uphill + random(-0.25, 0.42)
            const asymmetry = random(-0.2, 0.2)
            for (const [row, [widthFactor, depth]] of profile.entries()) {
                const t = row / (profile.length - 1)
                const distance = rimShelf
                    ? rimCenter + (t - 0.5) * length * 3.5
                    : (-uphill + t * (uphill + downhill)) * length + fragmentShift
                // Two raised facets share a bevel. Both outer seams sink into the wall.
                for (const lateral of [-1, -0.38, 0.4, 1]) {
                    const across =
                        lateral * halfWidth * widthFactor * (1 + lateral * asymmetry) +
                        lean * (t - 0.5)
                    const px = x + downhillX * distance + downhillZ * across
                    const pz = y + downhillZ * distance - downhillX * across
                    const outer = Math.abs(lateral) === 1
                    const offset =
                        outer || depth === 0
                            ? 0
                            : depth *
                              reach *
                              (lateral < 0 ? 1 + asymmetry : 0.68 - asymmetry)
                    const groundHeight = elevation(px, pz)
                    const lipHeight =
                        shelf && row === 2 && !outer
                            ? Math.max(groundHeight, rimShelf ? crestHeight : tile.height)
                            : groundHeight
                    const py = lipHeight + (offset === 0 ? -0.42 : 0.13)
                    const surfaceX = px + downhillX * offset
                    const surfaceZ = pz + downhillZ * offset
                    vertices.push([surfaceX, py, surfaceZ])
                }
            }
            for (let row = 0; row < profile.length - 1; row++) {
                for (let col = 0; col < 3; col++) {
                    const a = row * 4 + col
                    const b = a + 1
                    const c = a + 4
                    const d = c + 1
                    triangles.push(a, c, b, b, c, d)
                }
            }
            visit(vertices, shelf, triangles)
            if (!shelf || random() >= 0.55) continue

            const distance = rimShelf ? rimCenter : (-uphill + downhill) * 0.5 * length
            const pivotX = x + downhillX * distance
            const pivotZ = y + downhillZ * distance
            const level = elevation(pivotX, pivotZ)
            const firstSide = random() < 0.5 ? -1 : 1
            const sides = random() < 0.35 ? [firstSide, -firstSide] : [firstSide]
            for (const side of sides) {
                const offset = side * random(2.4, 3.1)
                const nextX = pivotX + downhillZ * offset
                const nextZ = pivotZ - downhillX * offset
                if (nextX < 2 || nextZ < 2 || nextX >= width - 3 || nextZ >= height - 3) continue
                const nextLevel = elevation(nextX, nextZ)
                const nextDrop =
                    elevation(nextX - downhillX, nextZ - downhillZ) -
                    elevation(nextX + downhillX, nextZ + downhillZ)
                if (Math.abs(nextLevel - level) > 0.5 || nextDrop < 1.45) continue

                const scale = random() < 0.6 ? random(0.64, 0.88) : random(1.04, 1.22)
                const angle = random(-0.28, 0.28)
                const cos = Math.cos(angle)
                const sin = Math.sin(angle)
                const copy = vertices.map(([vx, vy, vz]): CliffVertex => {
                    const localX = (vx - pivotX) * scale
                    const localZ = (vz - pivotZ) * scale
                    return [
                        nextX + localX * cos - localZ * sin,
                        level + (vy - level) * scale,
                        nextZ + localX * sin + localZ * cos,
                    ]
                })
                if (copy.some(([vx, , vz]) => vx < 0 || vz < 0 || vx >= width - 1 || vz >= height - 1)) continue
                visit(copy, true, triangles)
            }
        }
    }
}
