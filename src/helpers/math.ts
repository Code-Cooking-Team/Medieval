import { Position } from '+game/types'

export const distanceBetweenPoints = ([x1, y1]: Position, [x2, y2]: Position): number =>
    Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

export const maxValue = (curr: number, expected: number): number =>
    curr < expected ? curr : expected

export const addPosition = (a: Position, b: Position): Position => [
    a[0] + b[0],
    a[1] + b[1],
]

export const isSamePositon = (a: Position, b: Position): boolean =>
    a[0] === b[0] && a[1] === b[1]
