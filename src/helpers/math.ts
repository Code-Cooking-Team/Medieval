import { Position } from '+game/types'

export const distanceBetweenPoints = ([x1, y1]: Position, [x2, y2]: Position): number =>
    Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

export const maxValue = (curr: number, expected: number): number =>
    curr < expected ? curr : expected

export const addPosition = (a: Position, b: Position): Position => [
    a[0] + b[0],
    a[1] + b[1],
]

export const isSamePosition = (a: Position, b: Position): boolean =>
    a[0] === b[0] && a[1] === b[1]

/**
 * Converts rotation index (eg 0 - 3) to radians (eg Math.PI / 2)
 */
export const rotationIndexToDeg = (ri: number): number => ri * -(Math.PI / 2)

export const rotatePositionOnGrind = (
    position: Position,
    gridSize: [number, number, number?],
    rotationIndex: number,
) => {
    const [sizeX, sizeY] = gridSize
    const [x, y] = position

    let transposedPosition = position

    if (rotationIndex === 1) {
        transposedPosition = [sizeY - y, x]
    }
    if (rotationIndex === 2) {
        transposedPosition = [sizeX - x, sizeY - y]
    }
    if (rotationIndex === 3) {
        transposedPosition = [y, sizeX - x]
    }

    return transposedPosition
}

// Has offsets that are needed for applyTileGrid
export const getPointPositionOnRotatedGrid = (
    xLength: number,
    yLength: number,
    point: Position,
    rotation: number, // 0 - 3
): Position => {
    const [x, y] = point

    const structureDifferent = xLength - yLength

    if (rotation === 1) {
        const xNew = Math.ceil(xLength / 2) - 1 - structureDifferent
        return [xNew, y]
    }

    if (rotation === 2) {
        const xNew = Math.ceil(xLength / 2) - 1 - structureDifferent
        const yNew = Math.ceil(yLength / 2) - 1 + structureDifferent
        return [xNew, yNew]
    }

    if (rotation === 3) {
        const yNew = Math.ceil(yLength / 2) - 1 + structureDifferent
        return [x, yNew]
    }

    return [x, y]
}
