import { Position } from '+game/types'

import { squareFloodFill } from './squareFloodFill'

const _ = true
const $ = false

type BoolGrid = (1 | 0 | boolean)[][]

const getPositionsFromGrid = (grid: BoolGrid) => {
    const positions: Position[] = []
    for (let x = 0; x < grid.length; x++) {
        for (let y = 0; y < grid[x]!.length; y++) {
            if (grid[x]![y]) {
                positions.push([x, y])
            }
        }
    }
    return positions
}

const getGridCounts = (grid: Record<number, BoolGrid>) => {
    return Object.keys(grid).map(Number)
}

const canAddFunction = (grid: BoolGrid) => (position: Position) => {
    const [x, y] = position
    return !!grid[x]?.[y]
}

const emptyGrid = [
    [_, _, _],
    [_, _, _],
    [_, _, _],
]
const notEmptyGrid = [
    [_, _, _],
    [_, _, $],
    [_, $, $],
]

it('should return empty array when count is 0', () => {
    const result = squareFloodFill([0, 0], 0, canAddFunction(emptyGrid))
    expect(result).toEqual([])
})

const correctPositionsOnEmptyGrid: Record<number, BoolGrid> = {
    [1]: [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
    ],
    [2]: [
        [0, 0, 0],
        [0, 1, 1],
        [0, 0, 0],
    ],
    [3]: [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
    ],
    [4]: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
    ],
    [5]: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0],
    ],
    [6]: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 1],
    ],
    [7]: [
        [0, 1, 0],
        [1, 1, 1],
        [1, 1, 1],
    ],
    [8]: [
        [0, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
    ],
    [9]: [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
    ],
}

it.each(getGridCounts(correctPositionsOnEmptyGrid))(
    'should places item in correct squarish order ',
    (count) => {
        const result = squareFloodFill([1, 1], +count, canAddFunction(emptyGrid))
        const correctPosition = getPositionsFromGrid(correctPositionsOnEmptyGrid[count]!)

        expect(result).toHaveLength(correctPosition.length)

        correctPosition.forEach((pos) => {
            expect(result).toContainEqual(pos)
        })
    },
)

const correctPositionsOnNotEmptyGrid: Record<number, BoolGrid> = {
    [2]: [
        [0, 0, 0],
        [1, 1, 0],
        [0, 0, 0],
    ],
    [3]: [
        [0, 1, 0],
        [1, 1, 0],
        [0, 0, 0],
    ],
    [6]: [
        [1, 1, 1],
        [1, 1, 0],
        [1, 0, 0],
    ],
}

it.each(getGridCounts(correctPositionsOnNotEmptyGrid))(
    'should not place items on forbidden tiles',
    (count) => {
        const result = squareFloodFill([1, 1], +count, canAddFunction(notEmptyGrid))
        const correctPosition = getPositionsFromGrid(
            correctPositionsOnNotEmptyGrid[count]!,
        )

        expect(result).toHaveLength(correctPosition.length)

        correctPosition.forEach((pos) => {
            expect(result).toContainEqual(pos)
        })
    },
)

const hugeEmptyGrid = [
    [_, _, _, _, _],
    [_, _, _, _, _],
    [_, _, _, _, _],
    [_, _, _, _, _],
    [_, _, _, _, _],
]

const correctExpandedPositionsOnNotEmptyGrid: Record<number, BoolGrid> = {
    [9]: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
    ],
    [10]: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
    ],
    [11]: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 1, 1, 1],
        [0, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
    ],
    [12]: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1],
        [0, 1, 1, 1, 1],
        [0, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
    ],
    [14]: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
    ],
    [15]: [
        [0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
    ],
    [16]: [
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
    ],
    [18]: [
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
    ],
    [25]: [
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
    ],
}

it.each(getGridCounts(correctExpandedPositionsOnNotEmptyGrid))(
    'should expand base square',
    (count) => {
        const result = squareFloodFill([2, 2], +count, canAddFunction(hugeEmptyGrid))
        const correctPosition = getPositionsFromGrid(
            correctExpandedPositionsOnNotEmptyGrid[count]!,
        )

        expect(result).toHaveLength(correctPosition.length)

        correctPosition.forEach((pos) => {
            expect(result).toContainEqual(pos)
        })
    },
)
