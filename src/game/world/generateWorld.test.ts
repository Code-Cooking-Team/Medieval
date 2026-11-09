import { config } from '+config'
import { WaterRenderer } from '+game/renderer/WaterRenderer'

import { Mesh } from 'three'

import { DEFAULT_WORLD_SEED, generateWorld } from './generateWorld'
import { MeadowTile, OvergrownTile } from './Tile'
import { TileType } from './types'
import { isWaterfall } from './water'
import { World } from './World'

test('reproduces seeded terrain and restores the same world from a save', () => {
    const world = generateWorld(DEFAULT_WORLD_SEED)
    const snapshot = world.toJSON()
    expect(generateWorld(DEFAULT_WORLD_SEED).toJSON()).toEqual(snapshot)
    expect(generateWorld(DEFAULT_WORLD_SEED + 1).waterRegions).not.toEqual(
        world.waterRegions,
    )
    expect(World.fromJSON(JSON.parse(JSON.stringify(snapshot))).toJSON()).toEqual(
        snapshot,
    )

    const elevations = world.tiles.flat().map((tile) => tile.height)
    expect(Math.max(...elevations) - Math.min(...elevations)).toBeGreaterThan(10)

    const tile = world.getTile([28, 44])
    expect(new OvergrownTile(tile).height).toBe(tile.height)
})

test('renders local lake patches and a descending ribbon with shared waterfall seams', () => {
    const world = generateWorld()
    const river = world.waterRegions.find((region) => region.kind === 'river')!
    const lakes = world.waterRegions.filter((region) => region.kind === 'lake')
    expect(lakes).toHaveLength(2)
    expect(lakes[0]!.elevation).not.toBe(lakes[1]!.elevation)

    const waterfallRows = river.sections.flatMap((lower, row) => {
        if (!row) return []
        const upper = river.sections[row - 1]!
        expect(lower.elevation).toBeLessThan(upper.elevation)
        return isWaterfall(upper, lower) ? [row] : []
    })
    expect(waterfallRows.length).toBeGreaterThan(0)
    expect(waterfallRows.length).toBeLessThan(river.sections.length - 1)
    expect(new Set(river.sections.map(({ center }) => center[0])).size).toBeGreaterThan(1)
    expect(
        new Set(river.sections.map(({ halfWidth }) => halfWidth)).size,
    ).toBeGreaterThan(1)

    const renderer = new WaterRenderer(world)
    const [ribbon, ...patches] = renderer.group.children as Mesh[]
    expect(patches).toHaveLength(lakes.length)
    const scale = config.renderer.tileSize
    patches.forEach(({ geometry }, index) => {
        const lake = lakes[index]!
        expect(geometry.getIndex()!.count).toBe(lake.tiles.length * 6)
        expect(geometry.getAttribute('position').getY(0)).toBeCloseTo(
            lake.elevation * scale,
        )
    })

    const geometry = ribbon!.geometry
    const position = geometry.getAttribute('position')
    const stride = position.count / river.sections.length
    river.sections.forEach(({ center: [x, z], halfWidth, elevation }, row) => {
        expect(position.getX(row * stride)).toBeCloseTo((x - halfWidth) * scale)
        expect(position.getX((row + 1) * stride - 1)).toBeCloseTo((x + halfWidth) * scale)
        expect(position.getY(row * stride)).toBeCloseTo(elevation * scale)
        expect(position.getZ(row * stride)).toBeCloseTo(z * scale)
    })
    const indices = Array.from(geometry.getIndex()!.array)
    const falls = geometry.groups.filter((group) => group.materialIndex === 1)
    const facesPerRow = (stride - 1) * 6
    expect(falls.reduce((sum, group) => sum + group.count, 0)).toBe(
        waterfallRows.length * facesPerRow,
    )
    for (const { start, count } of falls) {
        const sheet = new Set(indices.slice(start, start + count))
        expect(
            indices.slice(start - facesPerRow, start).some((index) => sheet.has(index)),
        ).toBe(true)
        expect(
            indices
                .slice(start + count, start + count + facesPerRow)
                .some((index) => sheet.has(index)),
        ).toBe(true)
    }

    const base = position.getY(0)
    renderer.render({ elapsedTime: 1, deltaTime: 0.016 })
    expect(Math.abs(position.getY(0) - base)).toBeLessThanOrEqual(0.22 * scale)
    expect(position.getY(0)).not.toBe(base)
    renderer.destroy()
})

test('dry worlds create no water meshes and old saves retain separate wet patches', () => {
    const dryRenderer = new WaterRenderer(new World([[new MeadowTile()]]))
    expect(dryRenderer.group.children).toHaveLength(0)
    dryRenderer.destroy()

    const water = { type: TileType.Water, height: -1 }
    const dry = { type: TileType.Meadow, height: 0 }
    const legacy = World.fromJSON({
        tiles: [
            [water, dry, water],
            [water, dry, dry],
        ],
    })
    expect(legacy.waterRegions).toEqual([
        {
            kind: 'lake',
            tiles: [
                [0, 0],
                [0, 1],
            ],
            elevation: -0.5,
        },
        { kind: 'lake', tiles: [[2, 0]], elevation: -0.5 },
    ])
})
