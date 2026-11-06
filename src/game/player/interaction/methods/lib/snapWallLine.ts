import { Position } from '+game/types'

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

export function snapWallLine([x, y]: Position, [endX, endY]: Position): Position[] {
    const dx = endX - x
    const dy = endY - y
    const octant = Math.round(Math.atan2(dy, dx) / (Math.PI / 4))
    const [stepX, stepY] = directions[(octant + directions.length) % directions.length]!
    const steps = Math.round((dx * stepX + dy * stepY) / (stepX ** 2 + stepY ** 2))

    return Array.from({ length: steps + 1 }, (_, i) => [x + i * stepX, y + i * stepY])
}
