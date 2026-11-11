import { MAX_STEP_HEIGHT, type StandingSurface } from '+game/core/StandingSurfaces'
import { type Position } from '+game/types'

import { cliffElevation } from './cliffProfile'
import { TileType } from './types'
import { type World } from './World'

export interface CliffShelf {
    surfaces: StandingSurface[]
    downhill: Position
    relief: number
    seed: number
    base: number
    tilt: number
    size: 2 | 3
}

const cache = new WeakMap<World, { revision: number; shelves: CliffShelf[] }>()
const spacing = 36
const directions: Position[] = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
]

export function getCliffShelves(world: World) {
    const cached = cache.get(world)
    if (cached?.revision === world.tileRevision) return cached.shelves

    const [width, depth] = world.getSize()
    const shelves: CliffShelf[] = []
    for (let blockY = 2; blockY < depth - 3; blockY += spacing) {
        for (let blockX = 2; blockX < width - 3; blockX += spacing) {
            const seed =
                (world.seed ?? 0) ^
                Math.imul(blockX, 73856093) ^
                Math.imul(blockY, 19349663)
            let shelf: CliffShelf | undefined
            let bestScore = -Infinity
            for (let y = blockY; y < Math.min(blockY + spacing, depth - 3); y++) {
                for (let x = blockX; x < Math.min(blockX + spacing, width - 3); x++) {
                    const crest = world.hasTile([x, y])
                    if (
                        !crest?.canWalk ||
                        crest.buildingId ||
                        crest.type !== TileType.Step
                    )
                        continue
                    for (const direction of directions) {
                        const [dx, dy] = direction
                        const height = crest.height
                        const behind = cliffElevation(world, x - dx, y - dy)
                        const below = cliffElevation(world, x + 2 * dx, y + 2 * dy)
                        if (Math.abs(behind - height) > 0.75 || height - below < 2.8)
                            continue

                        // A rim that also drops sideways is a shoulder or a bend.
                        const sideDrop = Math.max(
                            height - cliffElevation(world, x - 2 * dy, y + 2 * dx),
                            height - cliffElevation(world, x + 2 * dy, y - 2 * dx),
                        )
                        const score =
                            Math.min(sideDrop, 8) * 2 + Math.min(height - below, 8) * 0.4
                        if (score <= bestScore) continue
                        const candidate =
                            makeShelf(world, [x, y], direction, seed, 3) ??
                            makeShelf(world, [x, y], direction, seed, 2)
                        if (!candidate) continue
                        shelf = candidate
                        bestScore = score
                    }
                }
            }
            if (
                shelf &&
                !shelves.some((other) =>
                    other.surfaces.some(({ position: [x, y] }) =>
                        shelf!.surfaces.some(
                            ({ position: [sx, sy] }) =>
                                Math.max(Math.abs(sx - x), Math.abs(sy - y)) < 10,
                        ),
                    ),
                )
            )
                shelves.push(shelf)
        }
    }
    cache.set(world, { revision: world.tileRevision, shelves })
    return shelves
}

// The walkable tile centers and the rock mesh sample the same folds.
export function cliffShelfTop(
    base: number,
    lateral: number,
    forward: number,
    halfWidth: number,
    tilt: number,
) {
    const shoulder = Math.abs(lateral) / halfWidth
    const rise = Math.max(-0.3, Math.min(forward * 0.32, 0.34))
    return (
        base +
        rise +
        lateral * tilt +
        0.2 * (1 - shoulder ** 2) -
        0.1 * shoulder ** 2 +
        0.08 * Math.cos(forward * Math.PI * 2 + lateral * Math.PI) +
        0.05 * Math.cos(lateral * Math.PI * 2)
    )
}

function makeShelf(
    world: World,
    [x, y]: Position,
    downhill: Position,
    seed: number,
    width: 2 | 3,
): CliffShelf | undefined {
    const [dx, dy] = downhill
    const at = (column: number, row: number): Position => [
        x + dx * row - dy * column,
        y + dy * row + dx * column,
    ]
    const height = world.getTile([x, y]).height
    const farRim = world.getTile(at(width - 1, 0)).height
    const tilt = Math.max(-0.45, Math.min(0.45, (farRim - height) / (width - 1)))
    const base = height + tilt * (width - 1) / 2
    const surfaces: StandingSurface[] = []
    let lowest = height
    for (let column = 0; column < width; column++) {
        const approach = at(column, 0)
        const ground = world.hasTile(approach)
        const lateral = column - (width - 1) / 2
        for (let row = 1; row <= width; row++) {
            const position = at(column, row)
            const top = cliffShelfTop(base, lateral, row - (width + 1) / 2, width / 2, tilt)
            const tile = world.hasTile(position)
            if (
                !tile ||
                tile.buildingId ||
                tile.type === TileType.Water ||
                tile.type === TileType.Rock ||
                top - tile.height < 0.85
            )
                return
            lowest = Math.min(lowest, tile.height)
            surfaces.push({
                id: `cliff:${position.join(',')}`,
                position,
                height: top,
                halfWidth: 0.36,
                ground:
                    row === 1 &&
                    ground?.canWalk &&
                    !ground.buildingId &&
                    Math.abs(ground.height - top) <= MAX_STEP_HEIGHT
                        ? [approach]
                        : [],
                links: [],
            })
        }
    }
    if (height - lowest < 2 || surfaces.filter(({ ground }) => ground.length).length < width - 1) return
    for (const surface of surfaces) {
        surface.links = surfaces
            .filter(
                ({ position }) =>
                    Math.abs(position[0] - surface.position[0]) +
                        Math.abs(position[1] - surface.position[1]) ===
                    1,
            )
            .map(({ id }) => id)
    }
    return { surfaces, downhill, relief: height - lowest, seed, base, tilt, size: width }
}
