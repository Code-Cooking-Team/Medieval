import {
    changeColorLightnessSaturation,
    ClassType,
    generateSimilarColor,
    random,
} from '+helpers'

import { omitBy } from 'lodash'

import { TileJSON, TileType } from './types'

export class Tile {
    public type = TileType.Empty

    public canBuild = true
    public canWalk = true
    public walkCost = 0
    public color = 0x000000
    public height = 0
    public treeChance = 0

    public constructor(public previousTile?: Tile) {}

    public toJSON(): TileJSON {
        const pristineTile = getPristineTile(this.type)

        const data = omitBy(this.getData(), (value, keyName) => {
            const key = keyName as keyof typeof pristineTile
            return pristineTile[key] === value
        })

        return {
            type: this.type,
            ...data,
            previousTile: this.previousTile?.toJSON(),
        }
    }

    public getData(): Partial<TileJSON> {
        return {
            canBuild: this.canBuild,
            canWalk: this.canWalk,
            walkCost: this.walkCost,
            color: this.color,
            height: this.height,
            treeChance: this.treeChance,
        }
    }

    public fromJSON({ previousTile, ...json }: TileJSON) {
        Object.assign(this, json)
        this.previousTile = previousTile ? getTileByJSON(previousTile) : undefined
    }
}

export type TileClass<T extends Tile = Tile> = ClassType<
    T,
    ConstructorParameters<typeof Tile>
>

export class ForestTile extends Tile {
    public type = TileType.Forest
    public color = generateSimilarColor(0x2b360a, 10)
    public height = random(0, 0.5)
    public treeChance = 0.1
}

export class SandTile extends Tile {
    public type = TileType.Meadow
    public color = generateSimilarColor(0x626948, 6)
    public height = random(-0.15, 0.4)
    public treeChance = 0.001
}
export class MeadowTile extends Tile {
    public type = TileType.Meadow
    public color = generateSimilarColor(0x274517, 4)
    public height = random(0, 0.2)
    public treeChance = 0.004
}

export class StepTile extends Tile {
    public type = TileType.Step
    public color = generateSimilarColor(0x5c5b58, 20, true)
    public canBuild = false
    public treeChance = 0.005
    public height = random(1, 2) + 0.2
}

export class WaterTile extends Tile {
    public type = TileType.Water
    public color = generateSimilarColor(0xbdb675, 10)
    public canWalk = false
    public canBuild = false
    public height = random(0, -1) - 0.5
}

export class WallTile extends Tile {
    public type = TileType.Wall
    public color = 0x222222
    public canBuild = false
    public canWalk = false
}

export class InsideTile extends Tile {
    public type = TileType.Inside
    public color = 0x474738
    public canBuild = false
    public walkCost = 3
}

export class ImportantFootpathTile extends Tile {
    public type = TileType.ImportantFootpath
    public color = 0x474738
}

export class FootpathTile extends Tile {
    public type = TileType.Footpath
    public color = 0x676068

    public constructor(public previousTile?: Tile) {
        super(previousTile)
        if (previousTile) {
            this.color = changeColorLightnessSaturation(previousTile.color, false, 0.3)
        }
    }
}

export class OvergrownTile extends Tile {
    public type = TileType.Overgrown
    public color = generateSimilarColor(0x052507, 4)
    public canBuild = false
    public treeChance = 0.1
    public walkCost = 3
}

const tileByType: Record<TileType, TileClass> = {
    [TileType.Empty]: Tile,
    [TileType.Forest]: ForestTile,
    [TileType.Meadow]: MeadowTile,
    [TileType.Step]: StepTile,
    [TileType.Water]: WaterTile,
    [TileType.Wall]: WallTile,
    [TileType.Inside]: InsideTile,
    [TileType.Footpath]: FootpathTile,
    [TileType.ImportantFootpath]: ImportantFootpathTile,
    [TileType.Overgrown]: OvergrownTile,
}

const getPristineTile = (type: TileType) => {
    const Tile = tileByType[type]
    return new Tile().getData()
}

export const getTileByJSON = (json: TileJSON) => {
    const TileClass = tileByType[json.type]
    const tile = new TileClass()
    tile.fromJSON(json)
    return tile
}
