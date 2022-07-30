import { Tile } from './Tile'

export enum TileType {
    Empty = 'Empty',
    Forest = 'Forest',
    Meadow = 'Meadow',
    Step = 'Step',
    Water = 'Water',
    Wall = 'Wall',
    Inside = 'Inside',
    Footpath = 'Footpath',
    Overgrown = 'Overgrown',
}

export type TileGrid = Tile[][]

export interface TileJSON {
    type: TileType
    canBuild?: boolean
    canWalk?: boolean
    walkCost?: number
    color?: number
    height?: number
    treeChance?: number
    previousTile?: TileJSON
}
