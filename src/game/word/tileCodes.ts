import {
    FootpathTile,
    ForestTile,
    InsideTile,
    MeadowTile,
    StepTile,
    Tile,
    WallTile,
    WaterTile,
} from '+game/Tile'
import { Position } from '+game/types'

const tileCodesEmoji = ['🌱', '🌲', '🌾', '🌊', '🛖', '🧱', '🦶🏽'] as const
const tileCodesAscii = ['.', 'F', '#', 'W', '!', '=', ','] as const

const tileCodes = [...tileCodesEmoji, ...tileCodesAscii]

export type TileCode = typeof tileCodes[number]
export type TileCodeGrid = TileCode[][]

export const tileCodeToInstance = (code: TileCode) => {
    switch (code) {
        case '🌱':
        case '.':
            return new MeadowTile()
        case '🌲':
        case 'F':
            return new ForestTile()
        case '🌾':
        case '#':
            return new StepTile()
        case '🌊':
        case 'W':
            return new WaterTile()

        case '🛖':
        case '!':
            return new InsideTile()
        case '🧱':
        case '=':
            return new WallTile()
        case '🦶🏽':
        case ',':
            return new FootpathTile()

        default:
            throw new Error(`Unknown tile code: ${code}`)
    }
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
