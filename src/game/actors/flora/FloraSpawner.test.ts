import type { Actor } from '+game/core/Actor'
import type { Game } from '+game/Game'
import { NaturePlayer } from '+game/player/NaturePlayer'
import { ActorType, Position } from '+game/types'
import { MeadowTile } from '+game/world/Tile'
import { World } from '+game/world/World'

import { FloraSpawner } from './FloraSpawner'

vi.mock('+helpers', async (importOriginal) => ({
    ...(await importOriginal<typeof import('+helpers')>()),
    seededRandom:
        () =>
        (min = 0, max = 1) =>
            min + (max - min) * 0.1,
}))

test('grows a connected clump of bushes near a tree on a fresh map', () => {
    const world = new World(
        Array.from({ length: 9 }, () =>
            Array.from({ length: 9 }, () =>
                Object.assign(new MeadowTile(), { treeChance: 0 }),
            ),
        ),
    )
    world.getTile([4, 4]).treeChance = 1
    const actors: Actor[] = []
    const game = {
        world,
        actors,
        addActor: (actor: Actor) => actors.push(actor),
        findActorsByPosition: () => [],
    } as unknown as Game

    new FloraSpawner(game, new NaturePlayer()).bulkSpawnPlants()

    const bushes = actors.filter((actor) => actor.type === ActorType.Bush)
    expect(bushes).toHaveLength(3)
    const positions = bushes.map((bush) => bush.position)
    const isAdjacent = ([x, y]: Position, [otherX, otherY]: Position) =>
        Math.max(Math.abs(x - otherX), Math.abs(y - otherY)) === 1
    expect(isAdjacent(positions[0]!, [4, 4])).toBe(true)
    expect(new Set(positions.map((position) => position.join(','))).size).toBe(3)
    expect(isAdjacent(positions[1]!, positions[0]!)).toBe(true)
    expect(positions.slice(0, 2).some((other) => isAdjacent(positions[2]!, other))).toBe(
        true,
    )
})
