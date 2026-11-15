import { type Tile } from './Tile'

export enum TileType {
    Empty = 'Empty',
    Forest = 'Forest',
    Meadow = 'Meadow',
    Sand = 'Sand',
    Step = 'Step',
    Rock = 'Rock',
    Water = 'Water',
    Wall = 'Wall',
    Inside = 'Inside',
    Footpath = 'Footpath',
    ImportantFootpath = 'ImportantFootpath',
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
    rockSize?: 1 | 2 | 3
    buildingId?: string
    previousTile?: TileJSON
}
