// Mulberry32 is a simple generator with a 32-bit state,
// but is extremely fast and has good quality randomness
// https://stackoverflow.com/a/47593316/11333665
const mulberry32 = (seed: number) => () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export const randomSeed = () => Number.MAX_SAFE_INTEGER * Math.random()

export const seededRandom = (seedString = randomSeed()) => {
    const rand = mulberry32(seedString)
    return (min: number, max: number) => {
        return rand() * (max - min) + min
    }
}
