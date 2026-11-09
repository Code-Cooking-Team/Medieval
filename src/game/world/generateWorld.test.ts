import { config } from '+config'
import { WaterRenderer } from '+game/renderer/WaterRenderer'

import { Mesh } from 'three'

import { DEFAULT_WORLD_SEED, generateWorld } from './generateWorld'
import { MeadowTile, OvergrownTile } from './Tile'
import { TileType } from './types'
import { expandWaterFootprint, isWaterfall, SHORE_OVERLAP } from './water'
import { World } from './World'

test('reproduces seeded terrain and restores the same world from a save', () => {
    const world = generateWorld(DEFAULT_WORLD_SEED)
    const snapshot = world.toJSON()
    expect(world.getSize()).toEqual([224, 208])
    expect(generateWorld(DEFAULT_WORLD_SEED).toJSON()).toEqual(snapshot)
    const alternate = generateWorld(DEFAULT_WORLD_SEED + 1)
    expect(alternate.getTile([58, 117]).height).not.toBe(world.getTile([58, 117]).height)
    expect(alternate.waterRegions).not.toEqual(world.waterRegions)
    expect(World.fromJSON(JSON.parse(JSON.stringify(snapshot))).toJSON()).toEqual(
        snapshot,
    )

    const elevations = world.tiles.flat().map((tile) => tile.height)
    expect(Math.max(...elevations) - Math.min(...elevations)).toBeGreaterThan(10)

    const tile = world.getTile([28, 44])
    expect(new OvergrownTile(tile).height).toBe(tile.height)
})

test('seeds vary water layouts and rivers descend to different edges', () => {
    const riverCounts = new Set<number>()
    const lakeCounts = new Set<number>()
    const outlets = new Set<string>()
    let hasWaterfall = false
    let branches = 0
    let broadens = false
    let hasLakeBay = false

    for (const seed of [0, 1, 2, 3, 4, 18, 19, 20, 21, 22, 23]) {
        const world = generateWorld(seed)
        const size = world.getSize()
        const rivers = world.waterRegions.filter((region) => region.kind === 'river')
        const lakes = world.waterRegions.filter((region) => region.kind === 'lake')
        const throughRivers = rivers.filter(({ axis, sections }) => {
            const along = axis === 'x' ? 0 : 1
            return (
                Math.abs(sections[0]!.center[along] - sections.at(-1)!.center[along]) ===
                size[along] - 1
            )
        })
        expect(throughRivers.length).toBeGreaterThan(rivers.length / 2)
        for (const river of throughRivers) {
            for (const end of [river.sections[0]!, river.sections.at(-1)!]) {
                expect(world.getTile(end.center).height).toBeLessThan(end.elevation)
            }
        }
        riverCounts.add(rivers.length)
        lakeCounts.add(lakes.length)
        for (const river of rivers) {
            const axis = river.axis === 'x' ? 0 : 1
            const exit = river.sections.at(-1)!.center[axis]
            expect([0, size[axis] - 1]).toContain(exit)
            outlets.add(river.axis + ',' + exit)

            const byRow = new Map(
                river.sections.map((section) => [section.center[axis], section]),
            )
            const widths = river.sections.slice(18).map((section) => section.halfWidth)
            broadens ||= Math.max(...widths) > Math.min(...widths) * 2
            for (const [index, section] of river.sections.entries()) {
                if (!index) continue
                const previous = river.sections[index - 1]!
                expect(section.elevation).toBeLessThan(previous.elevation)
                expect(Math.abs(section.center[axis] - previous.center[axis])).toBe(1)
                hasWaterfall ||= isWaterfall(previous, section)
            }
            for (const tributary of river.tributaries ?? []) {
                branches++
                const mouth = tributary.at(-1)!
                const parent = byRow.get(mouth.center[axis])!
                expect(mouth.center).toEqual(parent.center)
                expect(mouth.elevation).toBe(parent.elevation)
                expect(tributary[0]!.center).not.toEqual(
                    byRow.get(tributary[0]!.center[axis])!.center,
                )
                for (let step = 1; step < tributary.length; step++) {
                    expect(tributary[step]!.elevation).toBeLessThan(
                        tributary[step - 1]!.elevation,
                    )
                    hasWaterfall ||= isWaterfall(tributary[step - 1]!, tributary[step]!)
                }
            }
            for (const lake of lakes) {
                for (const point of lake.tiles) {
                    const section = byRow.get(point[axis])
                    if (!section) continue
                    const cross = axis === 0 ? 1 : 0
                    expect(
                        Math.abs(point[cross] - section.center[cross]),
                    ).toBeGreaterThan(section.halfWidth + 2)
                }
            }
        }
        const [width, height] = size
        for (const lake of lakes) {
            let previous: (typeof lake.tiles)[number] | undefined
            for (const tile of lake.tiles) {
                if (previous?.[1] === tile[1] && tile[0] - previous[0] >= 4) {
                    hasLakeBay = true
                }
                previous = tile
            }
            const shore = expandWaterFootprint(
                lake.tiles,
                width,
                height,
                SHORE_OVERLAP - 1,
            )
            const padding = expandWaterFootprint(
                lake.tiles,
                width,
                height,
                SHORE_OVERLAP + 1,
            )
            const exposedBank = [...padding].filter((cell) => !shore.has(cell))
            expect(
                exposedBank.every(
                    (cell) =>
                        world.getTile([cell % width, Math.floor(cell / width)]).height >
                        lake.elevation + 0.22,
                ),
            ).toBe(true)
        }
    }

    expect(riverCounts.size).toBeGreaterThan(1)
    expect(lakeCounts.size).toBeGreaterThan(1)
    expect(outlets.size).toBe(4)
    expect(hasWaterfall).toBe(true)
    expect(branches).toBeGreaterThan(3)
    expect(broadens).toBe(true)
    expect(hasLakeBay).toBe(true)
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
