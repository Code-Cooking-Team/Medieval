import { expect, test } from 'bun:test'
import { Tile } from '+game/world/Tile'
import { World } from '+game/world/World'

import { Pathfinding } from './Pathfinding'

const makeWorld = (heights: number[][]) =>
    new World(
        heights.map((row) => row.map((height) => Object.assign(new Tile(), { height }))),
    )

test('both route planners go around steep terrain in either direction', async () => {
    const world = makeWorld([
        [0, 1, 2],
        [0, 0, 3],
    ])
    const pathfinding = new Pathfinding(world)
    expect(pathfinding.canStep([1, 1], [2, 1])).toBe(false)
    expect(pathfinding.canStep([2, 1], [1, 1])).toBe(false)
    expect(pathfinding.canStep([1, 1], [2, 0])).toBe(false)
    expect(pathfinding.canStep([1, 0], [2, 0])).toBe(true)
    for (const [start, end] of [
        [
            [1, 1],
            [2, 1],
        ],
        [
            [2, 1],
            [1, 1],
        ],
    ] as const) {
        const findPath = pathfinding.findPath([...start], [...end])
        pathfinding.tick()
        const path = await findPath
        expect(path?.length).toBeGreaterThan(1)
        const route = pathfinding.findRoute(
            [...start],
            [{ target: 'ramp', positions: [[...end]] }],
        )
        expect(route?.path.length).toBeGreaterThan(1)
    }
})

test('a terrain update closes steep edges for new paths and previously planned steps', async () => {
    const world = makeWorld([[0, 0.5]])
    const pathfinding = new Pathfinding(world)
    expect(pathfinding.canStep([0, 0], [1, 0])).toBe(true)

    world.setTile([1, 0], Object.assign(new Tile(), { height: 3 }))
    expect(pathfinding.canStep([0, 0], [1, 0])).toBe(false)
    pathfinding.update()
    const blocked = pathfinding.findPath([0, 0], [1, 0])
    pathfinding.tick()
    expect(await blocked).toBeUndefined()

    world.setTile([1, 0], Object.assign(new Tile(), { height: 0.5 }))
    pathfinding.update()
    const reopened = pathfinding.findPath([0, 0], [1, 0])
    pathfinding.tick()
    expect(await reopened).toEqual([{ x: 1, y: 0 }])
})
