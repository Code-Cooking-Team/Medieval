import { carveDrainageNetwork } from './generateRiverNetwork'

export function generateWater(elevations: number[][], seed: number, chunkY: number) {
    const wet = elevations.map((row) => row.map(() => false))
    const regions = [carveDrainageNetwork(elevations, wet, seed, chunkY)]
    return { wet, regions }
}
