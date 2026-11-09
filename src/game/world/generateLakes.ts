import { seededRandom } from '+helpers/random'

import type { Position } from '../types'
import { mix, smooth } from './terrainNoise'
import { expandWaterFootprint, SHORE_OVERLAP } from './water'
import type { RiverSample, WaterRegion } from './water'

export function generateLakes(
    ground: number[][],
    wet: boolean[][],
    river: RiverSample[],
    seed: number,
    chunkY: number,
): WaterRegion[] {
    const width = ground[0]!.length
    const height = ground.length
    const random = seededRandom(seed ^ 0x43352df5 ^ Math.imul(chunkY, 0x2d152bf9))
    const riverBank = expandWaterFootprint(
        river.map(([x, y]) => [x, y]),
        width,
        height,
        SHORE_OVERLAP + 3,
    )
    const target = Math.round(((width * height) / (224 * 208)) * random(0.9, 1.35))
    const candidates: { x: number; y: number; score: number }[] = []

    // Prefer low spots surrounded by gentle terrain, with room for a dry rim.
    for (let row = 40; row < height - 48; row += 16) {
        for (let col = 40; col < width - 48; col += 16) {
            const x = col + Math.floor(random(0, 9))
            const y = row + Math.floor(random(0, 9))
            const center = ground[y]![x]!
            const rim = [
                ground[y - 15]![x]!,
                ground[y + 15]![x]!,
                ground[y]![x - 15]!,
                ground[y]![x + 15]!,
            ]
            const low = Math.min(center, ...rim)
            const high = Math.max(center, ...rim)
            const score =
                0.6 * (high - low) + 1.5 * (center - low) + 0.15 * center + random(0, 1)
            candidates.push({ x, y, score })
        }
    }

    candidates.sort((a, b) => a.score - b.score)
    const lakes: WaterRegion[] = []
    const centers: Position[] = []
    for (const { x, y } of candidates) {
        if (centers.some(([cx, cy]) => Math.hypot(cx - x, cy - y) < 76)) continue

        const angle = random(0, 2 * Math.PI)
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const length = random(13, 19)
        const breadth = random(9, 13)
        const phase = random(0, 2 * Math.PI)
        const bay = random(0.13, 0.23)
        const depth = random(1.15, 2.25)
        const elevation = ground[y]![x]! + random(0.1, 0.45)
        const reach = Math.ceil(length * (1 + bay + 0.14 + 9 / breadth))
        if (Math.min(x, y, width - 1 - x, height - 1 - y) <= reach) continue

        const basin: [x: number, y: number, distance: number][] = []
        for (let dy = -reach; dy <= reach; dy++) {
            for (let dx = -reach; dx <= reach; dx++) {
                const u = (dx * cos + dy * sin) / length
                const v = (-dx * sin + dy * cos) / breadth
                const bearing = Math.atan2(v, u) + phase
                const outline =
                    1 +
                    bay * Math.cos(3 * bearing) +
                    0.1 * Math.sin(5 * bearing + phase) +
                    0.04 * Math.cos(9 * bearing)
                const distance = (Math.hypot(u, v) - outline) * breadth
                if (distance < 9) basin.push([x + dx, y + dy, distance])
            }
        }
        if (basin.some(([col, row]) => riverBank.has(row * width + col))) continue

        const tiles: Position[] = []
        const rim = elevation + 0.55
        for (const [col, row, distance] of basin) {
            const original = ground[row]![col]!
            const bed = mix(elevation - depth, rim, smooth((distance + 5) / 7))
            const bank = mix(bed, Math.max(rim, original), smooth((distance - 2) / 3))
            ground[row]![col] = mix(bank, original, smooth((distance - 5) / 4))
            if (bed < elevation) {
                wet[row]![col] = true
                tiles.push([col, row])
            }
        }
        lakes.push({ kind: 'lake', tiles, elevation })
        centers.push([x, y])
        if (lakes.length === target) break
    }
    return lakes
}
