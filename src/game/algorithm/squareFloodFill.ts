import { Position } from '+game/types'

const squareVectors: Position[] = [
    // left/right
    [0, 1],
    [0, -1],

    // top/bottom
    [-1, 0],
    [1, 0],

    // bottom-left/bottom-right
    [1, 1],
    [1, -1],

    // top-right/top-left
    [-1, 1],
    [-1, -1],
]

const expandVectors: Position[] = [
    [0, 1],
    [0, -1],
    [-1, 0],
    [1, 0],

    // diagonal
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
]

export const squareFloodFill = (
    startPosition: Position,
    count: number,
    shouldAdd: (pos: Position) => boolean,
) => {
    if (count < 1) return []

    const visited = {} as Record<string, boolean>
    let counter = count
    const result: Position[] = []

    const canAdd = (position: Position) => {
        const key = position.toString()
        if (visited[key]) return false
        visited[key] = true

        return shouldAdd(position)
    }

    const checkAndAddToResults = (position: Position) => {
        if (canAdd(position)) {
            result.push(position)
            counter--
        }
    }

    checkAndAddToResults(startPosition)

    // Build a initial square #=start
    // 8 4 7
    // 2 # 1
    // 5 3 6

    for (const pos of squareVectors) {
        if (counter === 0) break
        const position = addVector(startPosition, pos)
        checkAndAddToResults(position)
    }

    if (!result.length) return []

    let vectorIndex = 0
    let maxIterations = 100_000

    while (counter > 0 && maxIterations > 0) {
        const vector = expandVectors[vectorIndex % expandVectors.length]!

        const l = result.length
        for (let i = 0; i < l; i++) {
            const position = addVector(result[i]!, vector)
            checkAndAddToResults(position)
            if (counter === 0) break
        }

        maxIterations--
        vectorIndex++
    }

    if (maxIterations === 0) {
        console.warn('[squareFloodFill] Max iterations reached!')
    }

    return result
}

const addVector = (a: Position, b: Position): Position => [a[0] + b[0], a[1] + b[1]]
