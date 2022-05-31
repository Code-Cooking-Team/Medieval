import { randomArrayItem } from '+helpers/array'
import { uuid } from '+helpers/basic'

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
    public color = 0x033d09
    public treeChance = 0.1
}

export class MeadowTile extends Tile {
    public name = 'Meadow'
    public color = randomArrayItem([0x00660a, 0x006009, 0x006101, 0x00760a])
    public treeChance = 0.008
}

export class StepTile extends Tile {
    public name = 'Step'
    public color = 0xbfaa34
    public canBuild = false
    public height = 2
    public treeChance = 0.005
}

export class WaterTile extends Tile {
    public name = 'Water'
    public canWalk = false
    public canBuild = false
    public color = 0xbdb675
    public height = -1
}

export class WallTile extends Tile {
    public name = 'Building'
    public canWalk = false
    public canBuild = false
    public color = 0x222222
    public height = 0
}

export class FootpathTile extends Tile {
    public name = 'Footpath'
    public color = 0x474738
    public height = 0
}

export class InsideTile extends Tile {
    public name = 'InsideTile'
    public canBuild = false
    public walkCost = 3
    public color = 0xada693
    public height = 0
}
