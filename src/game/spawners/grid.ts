import { FootpathTile, InsideTile, Tile, WallTile } from '+game/Tile'
import { Position } from '+game/types'

type GridTileCode = '.' | '!' | 'W'
export type Grid = GridTileCode[][]

const tileCodeToInstance = (code: GridTileCode) => {
    switch (code) {
        case '!':
            return new InsideTile()
        case 'W':
            return new WallTile()
        case '.':
            return new FootpathTile()
        default:
            throw new Error(`Unknown tile code: ${code}`)
    }
}

export const createTileGrid = (
    structure: GridTileCode[][],
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
