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
import { rotatePositionOnGrind } from '+helpers'

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

export const rotateGrid = <T>(grid: T[][], rotation = 0): T[][] => {
    if (rotation === 0) return grid

    const rotated: T[][] = []

    for (let y = 0; y < grid[0]!.length; y++) {
        rotated.push([])
        for (let x = 0; x < grid.length; x++) {
            rotated[y]!.push(grid[grid.length - 1 - x]![y]!)
        }
    }

    if (rotation > 0) {
        // TODO I don't think that resurrection is needed here…
        return rotateGrid(rotated, rotation - 1)
    }

    return rotated
}

export const applyTileGrid = (
    structure: TileCode[][],
    callback: (pos: Position, tileClass: TileClass, center: Position) => void,
    rotation = 0,
) => {
    const rotatedStructure = rotateGrid(structure, rotation)

    // IMPORTANT:
    // The structure is rotated so te X length is a [0].length, and the Y length is a structure.length
    const xLength = rotatedStructure[0]!.length
    const yLength = rotatedStructure.length

    let xCenter = Math.floor(xLength / 2)
    let yCenter = Math.floor(yLength / 2)

    // I don't work why is different from the original code
    const [xRotated, yRotated] = rotatePositionOnGrind(
        [xCenter, yCenter],
        [xLength, yLength],
        rotation,
    )

    rotatedStructure.forEach((row, localY) => {
        row.forEach((tileCode, localX) => {
            callback([localX, localY], tileCodeToClass(tileCode), [xRotated, yRotated])
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
