import { randomArrayItem } from '+helpers/array'
import { random, uuid } from '+helpers/basic'
import { generateSimilarColor } from '+helpers/color'

export abstract class Tile {
    public id = uuid()
    public name = 'Tile'
    public canBuild = true
    public canWalk = true
    public walkCost = 0
    public color = 0x000000
    public height = 0
    public treeChance = 0
}

export class ForestTile extends Tile {
    public name = 'Forest'
    public color = generateSimilarColor(0x2b360a, 10)
    public height = random(0, 0.5)
    public treeChance = 0.2
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
    public height = random(1, 2) + 0.2
    public treeChance = 0.005
}

export class WaterTile extends Tile {
    public name = 'Water'
    public canWalk = false
    public canBuild = false
    public height = random(0, -1) - 0.5
    public color = generateSimilarColor(0xbdb675, 10)
}

export class WallTile extends Tile {
    public name = 'Building'
    public canWalk = false
    public canBuild = false
    public color = 0x222222
    public height = 0
}
export class InsideTile extends Tile {
    public name = 'InsideTile'
    public canBuild = false
    public walkCost = 3
    public color = 0x474738
    public height = 0
}

export class FootpathTile extends Tile {
    public name = 'Footpath'
    public color = 0x474738
    public height = 0
}
