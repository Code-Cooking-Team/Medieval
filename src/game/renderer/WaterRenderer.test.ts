import { config } from '+config'
import { MeadowTile } from '+game/world/Tile'
import type { RiverSection, WaterRegion } from '+game/world/water'
import { World } from '+game/world/World'

import { Mesh, Raycaster, Vector3 } from 'three'

import { WaterRenderer } from './WaterRenderer'

test.each([
    {
        region: { kind: 'lake', tiles: [[5, 5]], elevation: 0 } satisfies WaterRegion,
        submerged: [
            [6, 5],
            [6, 6],
        ],
        outside: [9, 5],
    },
    {
        region: {
            kind: 'river',
            sections: [4, 5, 6].map((y) => ({
                center: [5, y],
                halfWidth: 1,
                elevation: 0,
            })),
        } satisfies WaterRegion,
        submerged: [
            [7, 5],
            [3, 5],
        ],
        outside: [9, 5],
    },
    {
        region: {
            kind: 'river',
            axis: 'x',
            sections: [4, 5, 6].map((x) => ({
                center: [x, 5],
                halfWidth: 1,
                elevation: 0,
            })),
        } satisfies WaterRegion,
        submerged: [
            [5, 7],
            [5, 3],
        ],
        outside: [5, 9],
    },
])('covers the submerged bank of a $region.kind', ({ region, submerged, outside }) => {
    const tiles = Array.from({ length: 11 }, () =>
        Array.from({ length: 11 }, () => new MeadowTile()),
    )
    for (const [x, y] of submerged) tiles[y!]![x!]!.height = -0.3
    const renderer = new WaterRenderer(new World(tiles, [region]))
    const scale = config.renderer.tileSize
    const castsOntoWater = ([x, z]: number[]) => {
        const ray = new Raycaster(
            new Vector3(x! * scale, 2, z! * scale),
            new Vector3(0, -1, 0),
        )
        return ray.intersectObjects(renderer.group.children).length > 0
    }

    expect(submerged.map(castsOntoWater)).toEqual([true, true])
    expect(castsOntoWater(outside)).toBe(false)
    renderer.destroy()
})

test.each(['x', 'y'] as const)(
    'shares waterfall seam vertices in a river along %s',
    (axis) => {
        const sections: RiverSection[] = [5, 4.9, 1.7, 1.6].map((elevation, i) => ({
            center: axis === 'x' ? [i + 3, 5] : [5, i + 3],
            halfWidth: 1 + i * 1.25,
            elevation,
        }))
        const tiles = Array.from({ length: 11 }, () =>
            Array.from({ length: 11 }, () => new MeadowTile()),
        )
        const renderer = new WaterRenderer(
            new World(tiles, [{ kind: 'river', axis, sections }]),
        )
        const geometry = (renderer.group.children[0] as Mesh).geometry
        const indices = Array.from(geometry.getIndex()!.array)
        const [upper, falls, lower] = geometry.groups
        expect(geometry.groups.map((group) => group.materialIndex)).toEqual([0, 1, 0])
        const sharedVertices = (a: typeof falls, b: typeof falls) => {
            const sheet = new Set(indices.slice(a!.start, a!.start + a!.count))
            return indices
                .slice(b!.start, b!.start + b!.count)
                .filter((index) => sheet.has(index))
        }
        expect(sharedVertices(falls, upper).length).toBeGreaterThan(2)
        expect(sharedVertices(falls, lower).length).toBeGreaterThan(2)

        const position = geometry.getAttribute('position')
        const stride = position.count / sections.length
        const cross =
            axis === 'x' ? position.getZ.bind(position) : position.getX.bind(position)
        for (let i = 1; i < position.count; i++) {
            if (i % stride !== 0) {
                expect(cross(i) - cross(i - 1)).toBeLessThanOrEqual(
                    0.801 * config.renderer.tileSize,
                )
            }
        }
        const base = position.getY(0)
        renderer.render({ elapsedTime: 1, deltaTime: 0.016 })
        expect(Math.abs(position.getY(0) - base)).toBeLessThanOrEqual(
            0.22 * config.renderer.tileSize,
        )
        expect(position.getY(0)).not.toBe(base)
        renderer.destroy()
    },
)

test('trims a tributary to the animated edge of the main channel', () => {
    const sections: RiverSection[] = [0, 1, 2, 3].map((row) => ({
        center: [7, row + 3],
        halfWidth: 1,
        elevation: 4 - row * 0.1,
    }))
    const tributary = sections.map((section, index): RiverSection => ({
        ...section,
        center: [[15, 12, 10, 7][index]!, section.center[1]],
    }))
    const tiles = Array.from({ length: 20 }, () =>
        Array.from({ length: 20 }, () => new MeadowTile()),
    )
    const renderer = new WaterRenderer(
        new World(tiles, [{ kind: 'river', sections, tributaries: [tributary] }]),
    )
    const geometry = (renderer.group.children[0] as Mesh).geometry
    const position = geometry.getAttribute('position')
    const stride = position.count / (sections.length + tributary.length)
    const firstBranchVertex = (sections.length + 1) * stride
    const mainEdge = 2 * stride - 1

    renderer.render({ elapsedTime: 1, deltaTime: 0.016 })
    expect(position.getX(firstBranchVertex)).toBe(position.getX(mainEdge))
    expect(position.getY(firstBranchVertex)).toBe(position.getY(mainEdge))
    expect(position.getZ(firstBranchVertex)).toBe(position.getZ(mainEdge))
    expect(position.getX(firstBranchVertex + 1)).toBeGreaterThan(position.getX(mainEdge))
    renderer.destroy()
})
