import '+game/actors'
import { DeerActor } from '+game/actors/units/deer/DeerActor'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { NaturePlayer } from '+game/player/NaturePlayer'
import { Tile, WallTile } from '+game/world/Tile'
import { World } from '+game/world/World'

import { expect, spyOn, test, vi } from 'bun:test'

import { BoarActor } from './BoarActor'

test('a herd across an impassable bank does not stall a movement order', async () => {
    vi.useFakeTimers()
    const rng = spyOn(Math, 'random').mockReturnValue(0.05)
    try {
        const world = new World(
            Array.from({ length: 120 }, () =>
                Array.from({ length: 170 }, (_, x) =>
                    x === 110 ? new WallTile() : new Tile(),
                ),
            ),
        )
        const player = new HumanPlayer()
        const nature = new NaturePlayer()
        const game = new Game(world, [player, nature])
        const queuedSearch = spyOn(game.pf, 'findPath')
        const bait = game.spawnActor(HumanActor, player, [112, 20])!
        for (let y = 17; y <= 23; y++) {
            game.spawnActor(BoarActor, nature, [108, y])
            game.spawnActor(DeerActor, nature, [107, y])
        }
        game.tick()

        const order = bait.setPathTo([120, 20])
        for (let tick = 0; tick < 5; tick++) {
            game.tick()
            vi.runAllTimers()
            await Promise.resolve()
        }

        expect(bait.position[0]).toBeGreaterThan(112)
        expect(await order).toBeDefined()
        expect(queuedSearch).toHaveBeenCalledTimes(1)
    } finally {
        rng.mockRestore()
        vi.useRealTimers()
    }
})
