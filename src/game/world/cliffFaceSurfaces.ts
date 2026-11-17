import { MAX_STEP_HEIGHT, type StandingSurface } from '+game/core/StandingSurfaces'
import { type Position } from '+game/types'

import { forEachCliffFace } from './cliffFaces'
import { type World } from './World'

const neighbors: Position[] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
]

// Anchor blocks align with the four-tile spacing in forEachCliffFace.
const FACE_BLOCK_SIZE = 32
const cache = new WeakMap<
    World,
    Map<string, { revision: number; surfaces: Map<string, StandingSurface> }>
>()

export function getCliffFaceSurfaces(world: World, occupied: ReadonlySet<string>) {
    let blocks = cache.get(world)
    if (!blocks) cache.set(world, (blocks = new Map()))
    const [width, height] = world.getSize()
    const surfaces = new Map<string, StandingSurface>()
    for (let top = 5; top < height - 5; top += FACE_BLOCK_SIZE) {
        for (let left = 5; left < width - 5; left += FACE_BLOCK_SIZE) {
            const right = Math.min(left + FACE_BLOCK_SIZE, width - 5)
            const bottom = Math.min(top + FACE_BLOCK_SIZE, height - 5)
            const key = `${left},${top}`
            const revision = world.getCliffRevisionForArea(
                left,
                top,
                right - 1,
                bottom - 1,
            )
            let block = blocks.get(key)
            if (block?.revision !== revision) {
                block = {
                    revision,
                    surfaces: getBlockSurfaces(world, { left, top, right, bottom }),
                }
                blocks.set(key, block)
            }
            for (const [key, surface] of block.surfaces) {
                if (
                    !occupied.has(key) &&
                    (surfaces.get(key)?.height ?? -Infinity) < surface.height
                )
                    surfaces.set(key, surface)
            }
        }
    }
    return [...surfaces.values()]
}

function getBlockSurfaces(
    world: World,
    bounds: NonNullable<Parameters<typeof forEachCliffFace>[2]>,
) {
    const surfaces = new Map<string, StandingSurface>()
    forEachCliffFace(
        world,
        (vertices, shelf, triangles) => {
            if (!shelf) return
            for (let index = 0; index < triangles.length; index += 3) {
                const [ax, ay, az] = vertices[triangles[index]!]!
                const [bx, by, bz] = vertices[triangles[index + 1]!]!
                const [cx, cy, cz] = vertices[triangles[index + 2]!]!
                const determinant = (bx - ax) * (cz - az) - (bz - az) * (cx - ax)
                const area = Math.hypot(
                    (by - ay) * (cz - az) - (bz - az) * (cy - ay),
                    determinant,
                    (bx - ax) * (cy - ay) - (by - ay) * (cx - ax),
                )
                if (determinant >= -0.55 * area) continue
                for (
                    let z = Math.ceil(Math.min(az, bz, cz));
                    z <= Math.max(az, bz, cz);
                    z++
                ) {
                    for (
                        let x = Math.ceil(Math.min(ax, bx, cx));
                        x <= Math.max(ax, bx, cx);
                        x++
                    ) {
                        const u =
                            ((x - ax) * (cz - az) - (z - az) * (cx - ax)) / determinant
                        const v =
                            ((bx - ax) * (z - az) - (bz - az) * (x - ax)) / determinant
                        if (u < 0 || v < 0 || u + v > 1) continue
                        const key = `${x},${z}`
                        const height = ay + u * (by - ay) + v * (cy - ay)
                        const tile = world.hasTile([x, z])
                        if (!tile || tile.buildingId || height - tile.height < 0.15)
                            continue
                        if ((surfaces.get(key)?.height ?? -Infinity) >= height) continue
                        const ground = neighbors
                            .map(([dx, dz]): Position => [x + dx, z + dz])
                            .filter((position) => {
                                const approach = world.hasTile(position)
                                return (
                                    approach?.canWalk &&
                                    !approach.buildingId &&
                                    Math.abs(approach.height - height) <= MAX_STEP_HEIGHT
                                )
                            })
                        if (ground.length) {
                            surfaces.set(key, {
                                id: `cliff-face:${key}`,
                                position: [x, z],
                                height,
                                ground,
                                links: [],
                                halfWidth: 0.18,
                            })
                        }
                    }
                }
            }
        },
        bounds,
    )
    return surfaces
}
