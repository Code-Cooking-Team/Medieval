import { Position } from '+game/types'

export const distanceBetweenPoints = ([x1, y1]: Position, [x2, y2]: Position): number =>
    Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

export const maxValue = (curr: number, expected: number): number =>
    curr < expected ? curr : expected

export const addPosition = ([x, y]: Position, b: Position | number): Position => {
    if (typeof b === 'number') {
        return [x + b, y + b]
    }
    return [x + b[0], y + b[1]]
}

export const subtractPosition = ([x, y]: Position, b: Position | number): Position => {
    if (typeof b === 'number') {
        return [x - b, y - b]
    }
    return [x - b[0], y - b[1]]
}

export const multiplyPosition = ([x, y]: Position, b: Position | number): Position => {
    if (typeof b === 'number') {
        return [x * b, y * b]
    }
    return [x * b[0], y * b[1]]
}

export const dividePosition = ([x, y]: Position, b: Position | number): Position => {
    if (typeof b === 'number') {
        return [x / b, y / b]
    }
    return [x / b[0], y / b[1]]
}

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
        transposedPosition = [sizeY - 1 - y, x]
    }
    if (rotationIndex === 2) {
        transposedPosition = [sizeX - 1 - x, sizeY - 1 - y]
    }
    if (rotationIndex === 3) {
        transposedPosition = [y, sizeX - 1 - x]
    }

    return transposedPosition
}

// Has offsets that are needed for applyTileGrid
export const getPointPositionOnRotatedGridByCenterPoint = (
    xLength: number,
    yLength: number,
    point: Position,
    rotation: number, // 0 - 3
): Position => {
    const [x, y] = point

    if (rotation === 1) {
        const xNew = Math.ceil(xLength / 2) - 1
        return [xNew, y]
    }

    if (rotation === 2) {
        const xNew = Math.ceil(xLength / 2) - 1
        const yNew = Math.ceil(yLength / 2) - 1
        return [xNew, yNew]
    }

    if (rotation === 3) {
        const yNew = Math.ceil(yLength / 2) - 1
        return [x, yNew]
    }

    return [x, y]
}
