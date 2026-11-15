import { type Position } from '+game/types'

const directions: Position[] = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
]

export function snapWallLine(
    [x, y]: Position,
    [endX, endY]: Position,
    allowDiagonal = true,
): Position[] {
    const dx = endX - x
    const dy = endY - y
    const step = allowDiagonal ? 1 : 2
    const octant = Math.round(Math.atan2(dy, dx) / ((step * Math.PI) / 4)) * step
    const [stepX, stepY] = directions[(octant + directions.length) % directions.length]!
    const steps = Math.round((dx * stepX + dy * stepY) / (stepX ** 2 + stepY ** 2))

    return Array.from({ length: steps + 1 }, (_, i) => [x + i * stepX, y + i * stepY])
}
