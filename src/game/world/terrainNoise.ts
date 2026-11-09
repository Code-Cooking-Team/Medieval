export const mix = (a: number, b: number, t: number) => a + (b - a) * t
export const smooth = (value: number) => {
    const t = Math.max(0, Math.min(1, value))
    return t * t * (3 - 2 * t)
}

export function createTerrainNoise(seed: number) {
    const corner = (x: number, y: number) => {
        let hash = Math.imul(x, 0x1f123bb5) ^ Math.imul(y, 0x5f356495) ^ seed
        hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b)
        hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b)
        return ((hash ^ (hash >>> 16)) >>> 0) / 0x80000000 - 1
    }

    const sample = (x: number, y: number) => {
        const left = Math.floor(x)
        const top = Math.floor(y)
        const u = smooth(x - left)
        const v = smooth(y - top)
        return mix(
            mix(corner(left, top), corner(left + 1, top), u),
            mix(corner(left, top + 1), corner(left + 1, top + 1), u),
            v,
        )
    }

    return {
        sample,
        layered(x: number, y: number) {
            return (
                0.58 * sample(x, y) +
                0.28 * sample(2 * x + 17, 2 * y - 13) +
                0.14 * sample(4 * x - 29, 4 * y + 23)
            )
        },
    }
}
