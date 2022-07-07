import { WoodCampActor } from '+game/actors/woodCamp/WoodCampActor'

import { createTileGrid, Grid } from '../grid'
import { BuildingSpawner } from '../Spawner'

export class WoodCampSpawner extends BuildingSpawner {
    public readonly grid: Grid = [
        ['.', '.', '.', '.', '.'],
        ['.', 'W', 'W', 'W', '.'],
        ['.', 'W', '!', 'W', '.'],
        ['.', 'W', '!', 'W', '.'],
        ['.', '.', '.', '.', '.'],
    ]

    public spawn() {
        const [x, y] = this.position
        const cabin = new WoodCampActor(this.game, [x + 2, y + 2])
        const currTail = this.game.word.getTile([x, y])

        this.game.addActor(cabin)

        this.game.word.setMultipleTiles((set) => {
            createTileGrid(this.grid, ([localX, localY], tile) => {
                tile.height = currTail.height
                set([x + localX, y + localY], tile)
            })
        })

        return cabin
    }
}
