import { cliffElevation } from '+game/world/cliffProfile'
import { cliffShelfTop, getCliffShelves } from '+game/world/cliffShelves'
import { TileType } from '+game/world/types'
import { type World } from '+game/world/World'
import { seededRandom } from '+helpers/random'

import {
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    LinearSRGBColorSpace,
    type Intersection,
} from 'three'

const shelfTops = new WeakMap<BufferGeometry, {
    start: number
    end: number
    surfaces: ReturnType<typeof getCliffShelves>[number]['surfaces']
}[]>()

export function pickCliffShelfTop(hit: Intersection, x: number, z: number) {
    const geometry = (hit.object as { geometry?: BufferGeometry }).geometry
    const face = hit.faceIndex
    if (!geometry || face == null) return
    const top = shelfTops.get(geometry)?.find(({ start, end }) => face >= start && face < end)
    return top?.surfaces.reduce((nearest, surface) => {
        const distance = ({ position }: typeof surface) =>
            (position[0] - x) ** 2 + (position[1] - z) ** 2
        return distance(surface) < distance(nearest) ? surface : nearest
    })
}

export function createCliffShelfGeometry(world: World, tileSize: number) {
    const [width, depth] = world.getSize()
    const positions: number[] = []
    const colors: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    const color = new Color()
    const stone = new Color().setHex(0x666663, LinearSRGBColorSpace)
    const grassTint = new Color()
    const tops: NonNullable<ReturnType<typeof shelfTops.get>> = []

    for (const {
        surfaces,
        downhill: [dx, dz],
        relief,
        seed,
        base,
        tilt,
        size,
    } of getCliffShelves(world)) {
        const random = seededRandom(seed ^ 0x74a810)
        const centerX =
            surfaces.reduce((sum, { position }) => sum + position[0], 0) / surfaces.length
        const centerZ =
            surfaces.reduce((sum, { position }) => sum + position[1], 0) / surfaces.length
        const halfWidth = size / 2
        const rimOffset = (size + 1) / 2
        const grassAtRim = Array.from({ length: size }, (_, column) => {
            const side = column - (size - 1) / 2
            for (const back of [0, 1, 2]) {
                const x = centerX - dx * (rimOffset + back) - dz * side
                const z = centerZ - dz * (rimOffset + back) + dx * side
                const tile = world.hasTile([x, z])
                if (
                    tile?.type === TileType.Meadow ||
                    tile?.type === TileType.Forest ||
                    tile?.type === TileType.Overgrown
                ) {
                    return { color: tile.color, weight: 1 - back * 0.2 }
                }
            }
        })
        const addVertex = (side: number, out: number, height: number, shade: number) => {
            const index = positions.length / 3
            const x = centerX + dx * out - dz * side
            const z = centerZ + dz * out + dx * side
            positions.push(x * tileSize, height * tileSize, z * tileSize)
            uvs.push(x / (width - 1), 1 - z / (depth - 1))
            color.copy(stone)
            if (shade > 0) {
                const column = Math.max(0, Math.min(size - 1, Math.round(side + (size - 1) / 2)))
                const grass = grassAtRim[column]
                if (grass) {
                    grassTint.setHex(grass.color, LinearSRGBColorSpace)
                    color.lerp(grassTint, shade * grass.weight)
                }
                color.multiplyScalar(1.08)
            }
            color.multiplyScalar(0.98 + 0.06 * Math.cos(side * 7) * Math.cos(out * 4))
            colors.push(color.r, color.g, color.b)
            return index
        }

        // Include tile centers in the surface mesh so the unit height matches it.
        const centers = Array.from({ length: size }, (_, i) => i + 0.5 - halfWidth)
        const columns = [-halfWidth, ...centers, halfWidth]
        const rows = [-halfWidth - 1.1, -halfWidth - 0.5, ...centers, halfWidth]
        const bend = random(-0.08, 0.08)
        const first = positions.length / 3
        const outline: { side: number; out: number; height: number; index: number }[] = []
        const grid = rows.map((forward, row) =>
            columns.map((side, column) => {
                const shoulder = Math.abs(side) / halfWidth
                const nose = Math.max(0, (forward - halfWidth + 0.5) * 2)
                const middle = Math.max(0, 1 - (forward / halfWidth) ** 2)
                const outer = Math.max(0, (Math.abs(side) - halfWidth + 0.5) * 2)
                const lateral =
                    side * (1 - 0.64 * nose ** 2) +
                    Math.sign(side) * outer * (0.36 * middle - 0.24 * (1 - middle)) +
                    bend * nose ** 2
                const out = forward + nose * (0.20 - 0.53 * shoulder ** 2)
                const height =
                    cliffShelfTop(base, lateral, out, halfWidth, tilt) -
                    0.17 * shoulder ** 4 * (1 - nose) -
                    0.12 * nose ** 4
                const standingCenter =
                    shoulder < 1 &&
                    Math.abs(forward) < halfWidth &&
                    Number.isInteger(forward + halfWidth - 0.5) &&
                    Number.isInteger(side + halfWidth - 0.5)
                let top = standingCenter
                    ? cliffShelfTop(base, side, forward, halfWidth, tilt)
                    : height
                if (forward <= -halfWidth - 0.3) {
                    // Follow the rim where the shelf meets it, then bury the rear edge.
                    const x = centerX + dx * out - dz * lateral
                    const z = centerZ + dz * out + dx * lateral
                    const terrain = cliffElevation(world, x, z)
                    top = row === 0 ? terrain - 0.25 : Math.max(top, terrain - 0.06)
                }
                const index = addVertex(
                    standingCenter ? side : lateral,
                    standingCenter ? forward : out,
                    top,
                    0.08 + 0.48 * Math.max(0, Math.min(1, (0.75 - out) / 2)),
                )
                const edge = { side: lateral, out, height: top, index }
                if (row === 0 || column === columns.length - 1) outline.push(edge)
                return edge
            }),
        )
        outline.push(...grid.at(-1)!.slice(0, -1).reverse())
        for (let row = rows.length - 2; row > 0; row--) outline.push(grid[row]![0]!)

        const topStart = indices.length / 3
        for (let row = 0; row < rows.length - 1; row++) {
            for (let column = 0; column < columns.length - 1; column++) {
                const a = first + row * columns.length + column
                const b = a + 1
                const c = a + columns.length
                const d = c + 1
                const mirror = column < (columns.length - 1) / 2
                if (mirror) indices.push(a, b, d, a, d, c)
                else indices.push(a, b, c, b, d, c)
            }
        }

        tops.push({ start: topStart, end: indices.length / 3, surfaces })

        const wallAtHeight = (side: number, out: number, height: number) => {
            for (let back = out; back >= -3.4; back -= 0.18) {
                const x = Math.min(
                    width - 1.001,
                    Math.max(0, centerX + dx * back - dz * side),
                )
                const z = Math.min(
                    depth - 1.001,
                    Math.max(0, centerZ + dz * back + dx * side),
                )
                if (cliffElevation(world, x, z) >= height + 0.12) return back - 0.22
            }
            return -3.6
        }

        // All sections taper towards the same root, buried inside the wall.
        const drop = Math.min(relief + 0.8, 5.4)
        const root = Math.min(-0.75, wallAtHeight(0, 0.5, base - drop) - 0.55)
        const shoulder = outline.map(({ side, out, height }) =>
            addVertex(side * 0.55, root + (out - root) * 0.40, (height + base - drop) / 2, 0),
        )
        const bottom = addVertex(0, root, base - drop, 0)
        for (let i = 0; i < outline.length; i++) {
            const j = (i + 1) % outline.length
            indices.push(
                outline[i]!.index, shoulder[i]!, outline[j]!.index,
                outline[j]!.index, shoulder[i]!, shoulder[j]!,
                bottom, shoulder[j]!, shoulder[i]!,
            )
        }
    }

    if (!positions.length) return new BufferGeometry()
    const geometry = new BufferGeometry()
        .setIndex(indices)
        .setAttribute('position', new Float32BufferAttribute(positions, 3))
        .setAttribute('color', new Float32BufferAttribute(colors, 3))
        .setAttribute('uv', new Float32BufferAttribute(uvs, 2))
    shelfTops.set(geometry, tops)
    geometry.computeVertexNormals()
    return geometry
}
