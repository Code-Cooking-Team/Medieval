import { Position } from '+game/types'

export const distanceBetweenPoints = ([x1, y1]: Position, [x2, y2]: Position) =>
    Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

export const maxValue = (curr: number, expected: number) =>
    curr < expected ? curr : expected

export const addVector = (a: Position, b: Position): Position => [
    a[0] + b[0],
    a[1] + b[1],
]
