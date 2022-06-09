import { Position } from '+game/types'

export const createTileGrid = <T,>(
    config: T,
    structure: (keyof T)[][],
    callback: (pos: Position, tile: any, center: Position) => void,
) => {
    const centerX = Math.floor(structure.length / 2)
    const centerY = Math.floor(structure[0].length / 2)

    structure.forEach((row, localY) => {
        row.forEach((tileCode, localX) => {
            callback([localX, localY], config[tileCode], [centerY, centerX])
        })
    })
}
