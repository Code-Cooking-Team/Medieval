import { GuardianActor } from '+game/actors/guardian/GuardianActor'
import { LumberjackActor } from '+game/actors/lumberjack/LumberjackActor'
import { LumberjackCabinActor } from '+game/actors/lumberjack/LumberjackCabinActor'
import { TreeActor } from '+game/actors/tree/TreeActor'
import { Game } from '+game/Game'
import { FootpathTile, InsideTile, WallTile } from '+game/Tile'
import { Position } from '+game/types'
import { createTileGrid } from '+lib/createTileGrid'

export enum BuildingKey {
    lumberjackCabin = 'lumberjackCabin',
    tree = 'tree',
    guardian = 'guardian',
}

export const buildingList = [
    BuildingKey.lumberjackCabin,
    BuildingKey.tree,
    BuildingKey.guardian,
]

export class Builder {
    constructor(public game: Game) {}

    private lumberjackCabin = ([x, y]: Position) => {
        const cabin = new LumberjackCabinActor(this.game, [x + 2, y + 2])
        const lumberjack = new LumberjackActor(this.game, [x, y], cabin)

        this.game.addActor(cabin)
        this.game.addActor(lumberjack)

        const currTail = this.game.word.getTile([x, y])

        const createWallTile = () => {
            const instance = new WallTile()
            instance.height = currTail.height
            return instance
        }

        const createFootpathTile = () => {
            const instance = new FootpathTile()
            instance.height = currTail.height
            return instance
        }

        const createInsideTile = () => {
            const instance = new InsideTile()
            instance.height = currTail.height
            return instance
        }

        this.game.word.setTiles((tiles) => {
            createTileGrid(
                {
                    '.': createFootpathTile,
                    'W': createWallTile,
                    '!': createInsideTile,
                },
                [
                    ['.', '.', '.', '.', '.'],
                    ['.', 'W', 'W', 'W', '.'],
                    ['.', 'W', '!', 'W', '.'],
                    ['.', 'W', '!', 'W', '.'],
                    ['.', '.', '.', '.', '.'],
                ],
                ([localX, localY], tileFn) => {
                    tiles[y + localY]![x + localX]! = tileFn()
                },
            )
        })
    }

    private tree = ([x, y]: Position) => {
        this.game.addActor(new TreeActor(this.game, [x, y]))
    }

    private guardian = ([x, y]: Position) => {
        this.game.addActor(new GuardianActor(this.game, [x, y]))
    }

    public actors = {
        [BuildingKey.lumberjackCabin]: this.lumberjackCabin,
        [BuildingKey.tree]: this.tree,
        [BuildingKey.guardian]: this.guardian,
    }

    public build(name: BuildingKey, [x, y]: Position) {
        this.actors[name]([x, y])
    }
}
