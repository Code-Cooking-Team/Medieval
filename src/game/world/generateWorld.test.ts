import { config } from '+config'
import { WaterRenderer } from '+game/renderer/WaterRenderer'

import { Mesh } from 'three'

import { DEFAULT_WORLD_SEED, generateWorld } from './generateWorld'
import { MeadowTile, OvergrownTile } from './Tile'
import { TileType } from './types'
import { World } from './World'

test('reproduces seeded terrain and restores the same world from a save', () => {
    const world = generateWorld(DEFAULT_WORLD_SEED)
    const snapshot = world.toJSON()
    expect(world.getSize()).toEqual([448, 416])
    expect(JSON.stringify(generateWorld(DEFAULT_WORLD_SEED).toJSON())).toBe(
        JSON.stringify(snapshot),
    )
    const alternate = generateWorld(DEFAULT_WORLD_SEED + 1)
    expect(alternate.getTile([58, 117]).height).not.toBe(world.getTile([58, 117]).height)
    expect(alternate.waterRegions).not.toEqual(world.waterRegions)
    const serialized = JSON.stringify(snapshot)
    expect(JSON.stringify(World.fromJSON(JSON.parse(serialized)).toJSON())).toBe(
        serialized,
    )

    let lowest = Infinity
    let highest = -Infinity
    world.forEachTile(({ height }) => {
        lowest = Math.min(lowest, height)
        highest = Math.max(highest, height)
    })
    expect(highest - lowest).toBeGreaterThan(10)

    const tile = world.getTile([28, 44])
    expect(new OvergrownTile(tile).height).toBe(tile.height)
}, 20_000)

test.each([18, 19])(
    'seed %i generates a connected channel from inlet to outlet',
    (seed) => {
        const world = generateWorld(seed)
        const [width, height] = world.getSize()
        const river = world.waterRegions.find((region) => region.kind === 'drainage')!
        const flooded = new Set(
            river.samples
                .filter(([x, y]) => world.getTile([x, y]).type === TileType.Water)
                .map(([x, y]) => y * width + x),
        )
        const edge = [...flooded].filter((cell) => {
            const x = cell % width
            const y = Math.floor(cell / width)
            return x === 0 || y === 0 || x === width - 1 || y === height - 1
        })
        expect(edge.length).toBeGreaterThan(0)
        const connected = new Set([edge[0]!])
        const open = [edge[0]!]
        for (const cell of open) {
            const x = cell % width
            const y = Math.floor(cell / width)
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (x + dx < 0 || x + dx >= width) continue
                    const next = (y + dy) * width + x + dx
                    if (!flooded.has(next) || connected.has(next)) continue
                    connected.add(next)
                    open.push(next)
                }
            }
        }
        expect(edge.every((cell) => connected.has(cell))).toBe(true)
        expect(connected.size).toBeGreaterThan(width)
        expect(
            edge.some(
                (cell) =>
                    Math.abs((cell % width) - (edge[0]! % width)) === width - 1 ||
                    Math.abs(Math.floor(cell / width) - Math.floor(edge[0]! / width)) ===
                        height - 1,
            ),
        ).toBe(true)

        expect(world.waterRegions).toHaveLength(1)
        expect(connected.size / flooded.size).toBeGreaterThan(0.99)

        const shallows = new Set(
            river.samples
                .filter(([x, y, elevation]) => {
                    const depth = elevation - world.getTile([x, y]).height
                    return depth > 0.15 && depth < 0.55 && connected.has(y * width + x)
                })
                .map(([x, y]) => y * width + x),
        )
        const basins: [number, number][] = []
        for (const cell of shallows) {
            const x = cell % width
            const y = Math.floor(cell / width)
            if (basins.some(([bx, by]) => Math.hypot(x - bx, y - by) < 40)) continue
            const interior = [-2, -1, 0, 1, 2].every((dy) =>
                [-2, -1, 0, 1, 2].every((dx) => shallows.has(cell + dy * width + dx)),
            )
            if (interior) basins.push([x, y])
        }
        expect(basins.length).toBeGreaterThanOrEqual(3)
    },
)

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
    expect(legacy.getSize()).toEqual([3, 2])
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

test.each([18, 19])(
    'seed %i has compatible terrain and crossings in north and south chunks',
    (seed) => {
        const chunks = [-1, 0, 1].map((chunkY) => generateWorld(seed, chunkY))
        const riverCrossings = (world: World, edge: number) =>
            world.waterRegions.flatMap((region) =>
                region.kind === 'drainage'
                    ? region.samples
                          .filter(([, y]) => y === edge)
                          .map(([x, , elevation]) => [x, elevation])
                    : [],
            )

        for (let i = 0; i < chunks.length - 1; i++) {
            const north = chunks[i]!
            const south = chunks[i + 1]!
            const last = north.getSize()[1] - 1
            expect(north.tiles[last]!.map((tile) => tile.toJSON())).toEqual(
                south.tiles[0]!.map((tile) => tile.toJSON()),
            )
            const crossings = riverCrossings(north, last)
            expect(crossings).toEqual(riverCrossings(south, 0))
            if (seed === 19) expect(crossings.length).toBeGreaterThan(0)
        }
    },
    15_000,
)
