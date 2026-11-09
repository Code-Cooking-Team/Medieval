import { seededRandom } from '+helpers/random'

export function flowsNorth(seed: number) {
    return seededRandom(seed ^ 0x2ca6ce21)() < 0.5
}

export function riverDatum(seed: number, chunkLatitude: number) {
    return (flowsNorth(seed) ? 1 : -1) * (chunkLatitude - 0.5) * 3.2
}

export function riverCrossing(
    seed: number,
    boundary: number,
    lane: number,
    lower: number,
    upper: number,
) {
    const random = seededRandom(
        seed ^ Math.imul(boundary, 0x561d97f5) ^ Math.imul(lane + 1, 0x719cd9bb),
    )
    return {
        cross: Math.round(random(lower + 1, upper - 1)),
        tangent: Math.floor(random(-1, 2)),
        halfWidth: random(1.6, 2.9),
        elevation: riverDatum(seed, boundary) + random(-0.25, 0.25),
    }
}
