import { createTerrainNoise, mix, smooth } from './terrainNoise'

const REGION_SIZE = 80

export function createTerrainRegions(seed: number) {
    const noise = createTerrainNoise(seed ^ 0x4fb92371)

    const transition = (
        position: number,
        along: number,
        line: number,
        noiseOffset: number,
    ) => {
        const phase = noise.sample(line, noiseOffset) * Math.PI
        const spacing = mix(38, 54, (1 + noise.sample(line, noiseOffset + 7)) / 2)
        const ramp = smooth(
            0.6 + 0.85 * Math.sin((along / spacing) * 2 * Math.PI + phase),
        )
        const width = mix(2.4, 30, ramp)
        return smooth(0.5 + ((position - 0.5) * REGION_SIZE) / width)
    }

    return (x: number, y: number) => {
        // Warp the region grid in world coordinates so the same relief continues across chunks.
        const regionX = (x + 21 * noise.layered(x / 86, y / 86 + 12)) / REGION_SIZE
        const regionY = (y + 21 * noise.layered(x / 86 - 9, y / 86)) / REGION_SIZE
        const left = Math.floor(regionX)
        const top = Math.floor(regionY)
        // Widen different stretches of each boundary into approaches between the same two levels.
        const u = transition(regionX - left, y, left, 21)
        const v = transition(regionY - top, x, top, -21)
        return (
            5 *
            mix(
                mix(noise.sample(left, top), noise.sample(left + 1, top), u),
                mix(noise.sample(left, top + 1), noise.sample(left + 1, top + 1), u),
                v,
            )
        )
    }
}
