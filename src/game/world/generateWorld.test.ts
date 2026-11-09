import { config } from '+config'
import { Pathfinding } from '+game/core/Pathfinding'
import { WaterRenderer } from '+game/renderer/WaterRenderer'

import { Mesh } from 'three'

import { DEFAULT_WORLD_SEED, generateWorld } from './generateWorld'
import { MeadowTile, OvergrownTile } from './Tile'
import { TileType } from './types'
import { expandWaterFootprint, SHORE_OVERLAP } from './water'
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

test('regional cliffs leave multiple walkable approaches between the same elevations', () => {
    const world = generateWorld(DEFAULT_WORLD_SEED)
    const pathfinding = new Pathfinding(world)
    const left = 16
    const right = 64

    // These rows cross the same regional boundary, with a cliff between two ramps.
    for (const [y, walkable] of [
        [85, true],
        [119, false],
        [159, true],
    ] as const) {
        const start = world.getTile([left, y])
        const end = world.getTile([right, y])
        expect(Math.abs(end.height - start.height)).toBeGreaterThan(4)
        expect(world.tiles[y]!.slice(left, right + 1).every((tile) => tile.canWalk)).toBe(
            true,
        )
        const steps = Array.from({ length: right - left }, (_, i) => left + i)
        expect(steps.every((x) => pathfinding.canStep([x, y], [x + 1, y]))).toBe(walkable)
        expect(steps.every((x) => pathfinding.canStep([x + 1, y], [x, y]))).toBe(walkable)
    }
})

test('seeds vary mountain coverage and river density independently', () => {
    const lowlands = generateWorld(0)
    const mixed = generateWorld(2)
    const mountains = generateWorld(19)
    const highlandShare = (world: World) => {
        const [width, height] = world.getSize()
        let total = 0
        let high = 0
        // Measure broad raised regions rather than counting individual rocky peaks.
        for (let y = 0; y + 40 <= height; y += 40) {
            for (let x = 0; x + 40 <= width; x += 40) {
                let sum = 0
                for (let row = y; row < y + 40; row++) {
                    for (let col = x; col < x + 40; col++)
                        sum += world.tiles[row]![col]!.height
                }
                if (sum / 1600 > 9) high++
                total++
            }
        }
        return high / total
    }
    const riverTiles = (world: World) =>
        world.waterRegions
            .find((region) => region.kind === 'drainage')!
            .samples.filter(([x, y]) => world.getTile([x, y]).type === TileType.Water)
            .length

    expect(highlandShare(lowlands)).toBe(0)
    expect(highlandShare(mixed)).toBeGreaterThan(0.4)
    expect(highlandShare(mixed)).toBeLessThan(0.7)
    expect(highlandShare(mountains)).toBeGreaterThan(0.7)

    const drierLowlands = generateWorld(11)
    expect(highlandShare(drierLowlands)).toBe(0)
    expect(riverTiles(lowlands)).toBeGreaterThan(riverTiles(drierLowlands) * 2)
})

test.each([3, 14, 19, 23])('seed %i keeps low ground close to river level', (seed) => {
    const world = generateWorld(seed)
    const [width, height] = world.getSize()
    const river = world.waterRegions.find((region) => region.kind === 'drainage')!
    const surface = new Map(
        river.samples.map((sample) => [sample[1] * width + sample[0], sample]),
    )
    let largestDrop = 0
    for (const [x, y, level] of river.samples) {
        if (Math.min(x, y, width - 1 - x, height - 1 - y) < 24) continue
        if (world.tiles[y]![x]!.canWalk) continue
        for (const [dx, dy] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
        ] as const) {
            const nx = x + 7 * dx
            const ny = y + 7 * dy
            if (surface.has(ny * width + nx)) continue
            // Compare to the bank of this reach, not to land below a waterfall.
            const crossesFall = [1, 2, 3, 4, 5, 6].some((distance) => {
                const sample = surface.get(
                    (y + distance * dy) * width + x + distance * dx,
                )
                return (
                    sample &&
                    !world.getTile([sample[0], sample[1]]).canWalk &&
                    level - sample[2] > 1.25
                )
            })
            if (crossesFall) continue
            const bank = world.tiles[ny]![nx]!
            if (bank.canWalk) largestDrop = Math.max(largestDrop, level - bank.height)
        }
    }
    expect(largestDrop).toBeLessThan(2)
})

test.each([18, 19, 14])(
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

        expect(connected.size / flooded.size).toBeGreaterThan(0.99)

        // The sparsest networks can have fewer stretches suitable for backwaters.
        if (seed === 14) return
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

test.each([0, 14, 19])('seed %i has several distinct lakes with dry banks', (seed) => {
    const world = generateWorld(seed)
    const [width, height] = world.getSize()
    const river = world.waterRegions.find((region) => region.kind === 'drainage')!
    const occupied = expandWaterFootprint(
        river.samples.map(([x, y]) => [x, y]),
        width,
        height,
        SHORE_OVERLAP,
    )
    const lakes = world.waterRegions.filter((region) => region.kind === 'lake')
    expect(lakes.length).toBeGreaterThanOrEqual(4)
    for (const lake of lakes) {
        expect(lake.tiles.length).toBeGreaterThan(150)
        const shore = expandWaterFootprint(lake.tiles, width, height, SHORE_OVERLAP)
        const submerged = new Set(lake.tiles.map(([x, y]) => y * width + x))
        expect([...shore].some((cell) => occupied.has(cell))).toBe(false)
        for (const cell of shore) {
            const tile = world.getTile([cell % width, Math.floor(cell / width)])
            expect(tile.type === TileType.Water).toBe(submerged.has(cell))
            if (submerged.has(cell))
                expect(tile.height).toBeLessThan(lake.elevation + 0.03)
            occupied.add(cell)
        }
        // The animated mesh overlaps the shoreline, but the surrounding rim stays above it.
        for (const cell of expandWaterFootprint(
            lake.tiles,
            width,
            height,
            SHORE_OVERLAP + 1,
        )) {
            if (shore.has(cell)) continue
            const tile = world.getTile([cell % width, Math.floor(cell / width)])
            expect(tile.height).toBeGreaterThan(lake.elevation + 0.22)
        }
    }
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
