import { Position } from '+game/types'
import {
    FootpathTile,
    ForestTile,
    ImportantFootpathTile,
    InsideTile,
    MeadowTile,
    OvergrownTile,
    StepTile,
    Tile,
    TileClass,
    WallTile,
    WaterTile,
} from '+game/world/Tile'

const tileCodes = {
    ['🌱']: MeadowTile,
    ['.']: MeadowTile,

    ['🌲']: ForestTile,
    ['F']: ForestTile,

    ['🌿']: OvergrownTile,
    ['~']: OvergrownTile,

    ['🌾']: StepTile,
    ['#']: StepTile,

    ['🌊']: WaterTile,
    ['W']: WaterTile,

    ['🛖']: InsideTile,
    ['!']: InsideTile,

    ['🧱']: WallTile,
    ['=']: WallTile,

    ['🟢']: FootpathTile,
    [' ']: FootpathTile,

    ['🦶🏽']: ImportantFootpathTile,
    [',']: ImportantFootpathTile,
}

export type TileCode = keyof typeof tileCodes
export type TileCodeGrid = TileCode[][]

export const tileCodeToClass = (code: TileCode) => {
    const TileClass = tileCodes[code]
    if (!TileClass) throw new Error(`Unknown tile code: ${code}`)
    return TileClass
}

export const rotateGrid = (grid: TileCode[][]) => {
    const rotated: TileCode[][] = []
    for (let y = 0; y < grid[0]!.length; y++) {
        rotated.push([])
        for (let x = 0; x < grid.length; x++) {
            rotated[y]!.push(grid[grid.length - 1 - x]![y]!)
        }
    }
    return rotated
}

export const applyTileGrid = (
    structure: TileCode[][],
    callback: (pos: Position, tileClass: TileClass, center: Position) => void,
    rotation?: number,
) => {
    if (rotation) {
        for (let i = 0; i < rotation; i++) {
            structure = rotateGrid(structure) as TileCode[][]
        }
    }

    let centerX = Math.floor(structure.length / 2)
    let centerY = Math.floor(structure[0]!.length / 2)

    // Fix center point after rotation TODO fix this better
    // (I don't know what I doing here but it works)
    if (rotation) {
        const structureDifferent = structure.length - structure[0]!.length

        if (rotation === 1) {
            centerX = Math.ceil(structure.length / 2) - 1 - structureDifferent
        }
        if (rotation === 2) {
            centerX = Math.ceil(structure.length / 2) - 1 - structureDifferent
            centerY = Math.ceil(structure[0]!.length / 2) - 1 + structureDifferent
        }
        if (rotation === 3) {
            centerY = Math.ceil(structure[0]!.length / 2) - 1 + structureDifferent
        }
    }

    structure.forEach((row, localY) => {
        row.forEach((tileCode, localX) => {
            callback([localX, localY], tileCodeToClass(tileCode), [centerY, centerX])
        })
    })
}

export const createTilesFromGrid = (structure: TileCode[][]): Tile[][] => {
    return structure.map((row) =>
        row.map((tileCode) => {
            const TileClass = tileCodeToClass(tileCode)
            return new TileClass()
        }),
    )
}
