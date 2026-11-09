import { generateLakes } from './generateLakes'
import { carveDrainageNetwork } from './generateRiverNetwork'

export function generateWater(elevations: number[][], seed: number, chunkY: number) {
    const wet = elevations.map((row) => row.map(() => false))
    const river = carveDrainageNetwork(elevations, wet, seed, chunkY)
    const regions = [
        river,
        ...generateLakes(elevations, wet, river.samples, seed, chunkY),
    ]
    return { wet, regions }
}
