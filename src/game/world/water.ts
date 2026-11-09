import type { Position } from '../types'

export interface RiverSection {
    center: Position
    halfWidth: number
    elevation: number
}

export type WaterRegion =
    | { kind: 'lake'; tiles: Position[]; elevation: number }
    | {
          kind: 'river'
          axis?: 'x' | 'y'
          sections: RiverSection[]
          tributaries?: RiverSection[][]
      }

export const SHORE_OVERLAP = 2

export function expandWaterFootprint(
    tiles: Position[],
    width: number,
    height: number,
    padding: number,
) {
    const footprint = new Set<number>()
    for (const [x, y] of tiles) {
        for (
            let row = Math.max(0, y - padding);
            row <= Math.min(height - 1, y + padding);
            row++
        ) {
            for (
                let column = Math.max(0, x - padding);
                column <= Math.min(width - 1, x + padding);
                column++
            ) {
                footprint.add(row * width + column)
            }
        }
    }
    return footprint
}

export function isWaterfall(upper: RiverSection, lower: RiverSection) {
    const distance = Math.hypot(
        upper.center[0] - lower.center[0],
        upper.center[1] - lower.center[1],
    )
    return upper.elevation - lower.elevation > 1.25 * distance
}
