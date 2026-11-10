import type { Game } from '+game/Game'
import { ActorType, type Position } from '+game/types'
import type { Tile } from '+game/world/Tile'

export function canGrowTree(
    game: Game,
    tile: Tile,
    position: Position,
    roll: () => number,
) {
    return (
        tile.treeChance !== 0 &&
        roll() <= tile.treeChance &&
        !game
            .findActorsByPosition(position, 1)
            .some((actor) => actor.type !== ActorType.Bush)
    )
}
