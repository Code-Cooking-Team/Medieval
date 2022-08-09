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

export const applyTileGrid = (
    structure: TileCode[][],
    callback: (pos: Position, tileClass: TileClass, center: Position) => void,
) => {
    const centerX = Math.floor(structure.length / 2)
    const centerY = Math.floor(structure[0]!.length / 2)

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
