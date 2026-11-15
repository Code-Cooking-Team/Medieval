import { type Position } from '../types'
import { RockTile } from './Tile'
import { type TileGrid, TileType } from './types'

export const SMALL_ROCK_TOP = 0.41

export type RockSize = 1 | 2 | 3

export function rockFootprint([x, y]: Position, size: RockSize) {
    return Array.from({ length: size * size }, (_, index): Position => [
        x + (index % size),
        y + Math.floor(index / size),
    ])
}

export function prepareRockPlacement(
    tiles: TileGrid,
    position: Position,
    size: RockSize,
    preserveGround = false,
) {
    const footprint = rockFootprint(position, size)
    const replacements = []
    for (const [x, y] of footprint) {
        const tile = tiles[y]?.[x]
        if (
            !tile?.canWalk ||
            (tile.type !== TileType.Step &&
                (!tile.canBuild ||
                    (tile.type !== TileType.Meadow && tile.type !== TileType.Forest)))
        )
            return
        const replacement =
            x === position[0] && y === position[1]
                ? Object.assign(new RockTile(preserveGround ? tile : undefined), {
                      height: tile.height,
                      color: tile.color,
                      rockSize: size,
                  })
                : Object.assign(
                      Object.create(Object.getPrototypeOf(tile)) as typeof tile,
                      tile,
                      {
                          previousTile: preserveGround ? tile : tile.previousTile,
                          canWalk: false,
                          canBuild: false,
                          treeChance: 0,
                      },
                  )
        replacements.push({ x, y, tile: replacement })
    }
    return replacements
}
