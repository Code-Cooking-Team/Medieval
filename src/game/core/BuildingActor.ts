import { Position } from '+game/types'
import { TileCodeGrid } from '+game/world/tileCodes'

import { Actor, ActorJSON } from './Actor'

export class BuildingActor extends Actor {
    public selectImportance = 1
    public grid: TileCodeGrid = [['.']]
    public height = 3

    // TODO Take into account ROTATION
    // Watch out for the fact that interaction mesh needs NOT rotated size
    public getSize() {
        if (!this.grid[0]) throw new Error('[BuildingActor] Grid is empty')
        return [this.grid[0].length, this.grid.length, this.height] as [
            number,
            number,
            number,
        ]
    }

    public getGlobalPosition() {
        const [sizeX, sizeY] = this.getSize()
        const [x, y] = this.position

        return [x - Math.floor(sizeX / 2), y - Math.floor(sizeY / 2)] as Position
    }

    public toJSON(): BuildingActorJSON {
        return {
            ...super.toJSON(),
            grid: this.grid,
            height: this.height,
        }
    }

    public fromJSON({ grid, height, ...json }: BuildingActorJSON) {
        super.fromJSON(json)
        Object.assign(this, { grid, height })
    }
}

export interface BuildingActorJSON extends ActorJSON {
    grid: TileCodeGrid
    height: number
}
