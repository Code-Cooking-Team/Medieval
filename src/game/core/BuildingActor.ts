import { Grid } from '+game/types'

import { Actor } from './Actor'

export class BuildingActor extends Actor {
    public selectImportance = 1
    public grid: Grid = [['.']]
    public height = 3

    public getSize() {
        if (!this.grid[0]) throw new Error('[BuildingActor] Grid is empty')
        return [this.grid[0].length, this.grid.length, this.height] as [
            number,
            number,
            number,
        ]
    }
}
