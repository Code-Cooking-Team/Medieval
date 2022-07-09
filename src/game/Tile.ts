import { random, uuid } from '+helpers'
import { generateSimilarColor } from '+helpers'

export abstract class Tile {
    public id = uuid()
    public name = 'Tile'

    public canBuild = true
    public canWalk = true
    public walkCost = 0
    public color = 0x000000
    public height = 0
    public treeChance = 0

    public constructor(public previousTile?: Tile) {}
}

export type TileGrid = Tile[][]

export class ForestTile extends Tile {
    public name = 'Forest'
    public color = generateSimilarColor(0x2b360a, 10)
    public height = random(0, 0.5)
    public treeChance = 0.1
}

export class MeadowTile extends Tile {
    public name = 'Meadow'
    public color = generateSimilarColor(0x274517, 4)
    public height = random(0, 0.2)
    public treeChance = 0.004
}

export class StepTile extends Tile {
    public name = 'Step'
    public color = generateSimilarColor(0xbfaa34, 20, true)
    public canBuild = false
    public treeChance = 0.005
    public height = random(1, 2) + 0.2
}

export class WaterTile extends Tile {
    public name = 'Water'
    public color = generateSimilarColor(0xbdb675, 10)
    public canWalk = false
    public canBuild = false
    public height = random(0, -1) - 0.5
}

export class WallTile extends Tile {
    public name = 'Building'
    public color = 0x222222
    public canBuild = false
    public canWalk = false
}

export class InsideTile extends Tile {
    public name = 'InsideTile'
    public color = 0x474738
    public canBuild = false
    public walkCost = 3
}

export class FootpathTile extends Tile {
    public name = 'Footpath'
    public color = 0x474738
}

export class OvergrownTile extends Tile {
    public name = 'Overgrown'
    public color = generateSimilarColor(0x052507, 4)
    public canBuild = false
    public treeChance = 0.1
    public walkCost = 3
}
