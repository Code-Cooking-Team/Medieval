import { type World } from './World'

// Cross sections shared by the cliff ribs and their wider walkable shelves.
export const shelfProfiles = [
    [
        [0.55, 0],
        [1.9, 0.45],
        [2.25, 1.5],
        [1.1, 0.3],
        [0.55, 0],
    ],
    [
        [0.64, 0],
        [1.55, 0.72],
        [1.4, 1.34],
        [1.25, 0.63],
        [0.62, 0],
    ],
    [
        [0.74, 0],
        [1.32, 0.36],
        [2.05, 1.12],
        [1.54, 0.53],
        [0.72, 0],
    ],
] as const

export function cliffElevation(world: World, x: number, y: number) {
    const left = Math.floor(x)
    const top = Math.floor(y)
    const u = x - left
    const v = y - top
    const a = world.tiles[top]![left]!.height
    const b = world.tiles[top]![left + 1]!.height
    const c = world.tiles[top + 1]![left]!.height
    const d = world.tiles[top + 1]![left + 1]!.height
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v
}
