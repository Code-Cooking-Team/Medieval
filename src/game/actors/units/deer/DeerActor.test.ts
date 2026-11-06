import type { Game } from '+game/Game'
import type { Player } from '+game/player/types'
import { ActorType, Position } from '+game/types'

import { DeerActor } from './DeerActor'

test.each([ActorType.Human, ActorType.Boar])(
    'a nearby %s interrupts the walk and sends the deer in the opposite direction',
    (type) => {
        const findPath = vi.fn()
        const findActorsByPosition = vi.fn(() => [{ type, position: [0, 10] }])
        const game = {
            findActorsByPosition,
            pf: { findPath },
            world: { hasTile: () => true, getTile: () => ({ canWalk: true }) },
        } as unknown as Game
        const deer = new DeerActor(game, {} as Player, [10, 10])
        deer.path = [{ x: 9, y: 10 }]

        deer.tick()
        expect(findActorsByPosition).toHaveBeenCalledWith([10, 10], 10)
        expect(deer.isFleeing).toBe(true)
        expect(deer.position[0]).toBeGreaterThan(10)
        const goal = deer.path.at(-1)!
        expect(goal.x).toBeGreaterThan(10)
        expect(Math.hypot(goal.x - 10, goal.y - 10)).toBeCloseTo(10, 0)
        expect(findPath).not.toHaveBeenCalled()
    },
)

test('a deer escapes along the riverbank when the land across the river is unreachable', () => {
    const findPath = vi.fn(async () => undefined)
    const game = {
        findActorsByPosition: () => [{ type: ActorType.Human, position: [5, 10] }],
        pf: { findPath },
        world: {
            hasTile: ([x, y]: Position) => x >= 0 && x <= 25 && y >= 0 && y <= 25,
            getTile: ([x]: Position) => ({ canWalk: x < 11 || x > 13 }),
        },
    } as unknown as Game
    const deer = new DeerActor(game, {} as Player, [10, 10])

    deer.tick()

    const goal = deer.path.at(-1)!
    expect(goal).toBeDefined()
    expect(Math.hypot(goal.x - 5, goal.y - 10)).toBeGreaterThan(10)
    expect(deer.path.every(({ x }) => x < 11)).toBe(true)
    expect(findPath).not.toHaveBeenCalled()
})
