import {
    FootpathTile,
    ForestTile,
    InsideTile,
    MeadowTile,
    OvergrownTile,
    StepTile,
    Tile,
    WallTile,
    WaterTile,
} from '+game/Tile'
import { Position } from '+game/types'

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

    ['🦶🏽']: FootpathTile,
    [',']: FootpathTile,
}

export type TileCode = keyof typeof tileCodes
export type TileCodeGrid = TileCode[][]

export const tileCodeToInstance = (code: TileCode) => {
    const TileClass = tileCodes[code]
    if (!TileClass) throw new Error(`Unknown tile code: ${code}`)
    return new TileClass()
}

export const applyTileGrid = (
    structure: TileCode[][],
    callback: (pos: Position, tile: Tile, center: Position) => void,
) => {
    const centerX = Math.floor(structure.length / 2)
    const centerY = Math.floor(structure[0]!.length / 2)

    structure.forEach((row, localY) => {
        row.forEach((tileCode, localX) => {
            callback([localX, localY], tileCodeToInstance(tileCode), [centerY, centerX])
        })
    })
}

export const createTilesFromGrid = (structure: TileCode[][]): Tile[][] => {
    return structure.map((row) => row.map((tileCode) => tileCodeToInstance(tileCode)))
}
