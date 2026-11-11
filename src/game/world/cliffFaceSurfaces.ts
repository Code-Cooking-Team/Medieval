import { MAX_STEP_HEIGHT, type StandingSurface } from '+game/core/StandingSurfaces'
import { type Position } from '+game/types'

import { forEachCliffFace } from './cliffFaces'
import { type World } from './World'

const neighbors: Position[] = [[1, 0], [-1, 0], [0, 1], [0, -1]]

export function getCliffFaceSurfaces(world: World, occupied: ReadonlySet<string>) {
    const surfaces = new Map<string, StandingSurface>()
    forEachCliffFace(world, (vertices, shelf, triangles) => {
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
            for (let z = Math.ceil(Math.min(az, bz, cz)); z <= Math.max(az, bz, cz); z++) {
                for (let x = Math.ceil(Math.min(ax, bx, cx)); x <= Math.max(ax, bx, cx); x++) {
                    const u = ((x - ax) * (cz - az) - (z - az) * (cx - ax)) / determinant
                    const v = ((bx - ax) * (z - az) - (bz - az) * (x - ax)) / determinant
                    if (u < 0 || v < 0 || u + v > 1) continue
                    const key = `${x},${z}`
                    if (occupied.has(key)) continue
                    const height = ay + u * (by - ay) + v * (cy - ay)
                    const tile = world.hasTile([x, z])
                    if (!tile || tile.buildingId || height - tile.height < 0.15) continue
                    if ((surfaces.get(key)?.height ?? -Infinity) >= height) continue
                    const ground = neighbors
                        .map(([dx, dz]): Position => [x + dx, z + dz])
                        .filter((position) => {
                            const approach = world.hasTile(position)
                            return approach?.canWalk && !approach.buildingId &&
                                Math.abs(approach.height - height) <= MAX_STEP_HEIGHT
                        })
                    if (ground.length) {
                        surfaces.set(key, { id: `cliff-face:${key}`, position: [x, z], height, ground, links: [], halfWidth: 0.18 })
                    }
                }
            }
        }
    })
    return [...surfaces.values()]
}
