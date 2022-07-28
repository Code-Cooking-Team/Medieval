import { TileCodeGrid } from '+game/world/tileCodes'

import { Actor, ActorJSON } from './Actor'

export class BuildingActor extends Actor {
    public selectImportance = 1
    public grid: TileCodeGrid = [['.']]
    public height = 3

    public getSize() {
        if (!this.grid[0]) throw new Error('[BuildingActor] Grid is empty')
        return [this.grid[0].length, this.grid.length, this.height] as [
            number,
            number,
            number,
        ]
    }

    public toJSON(): BuildingActorJSON {
        return {
            ...super.toJSON(),
            grid: this.grid,
            height: this.height,
        }
    }
}

export interface BuildingActorJSON extends ActorJSON {
    grid: TileCodeGrid
    height: number
}
