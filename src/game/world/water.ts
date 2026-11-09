import type { Position } from '../types'

export interface RiverSection {
    center: Position
    halfWidth: number
    elevation: number
}

export type WaterRegion =
    | { kind: 'lake'; tiles: Position[]; elevation: number }
    | { kind: 'river'; sections: RiverSection[] }

export function isWaterfall(upper: RiverSection, lower: RiverSection) {
    const distance = Math.hypot(
        upper.center[0] - lower.center[0],
        upper.center[1] - lower.center[1],
    )
    return upper.elevation - lower.elevation > 1.25 * distance
}
