import { WoodCampActor } from '+game/actors/woodCamp/WoodCampActor'

import { createTileGrid } from '../grid'
import { BuildingSpawner } from '../Spawner'

export class WoodCampSpawner extends BuildingSpawner {
    public spawn() {
        const [x, y] = this.position
        const cabin = new WoodCampActor(this.game, [x + 2, y + 2])
        const currTail = this.game.word.getTile([x, y])

        this.game.addActor(cabin)

        this.game.word.setMultipleTiles((set) => {
            createTileGrid(cabin.grid, ([localX, localY], tile) => {
                tile.height = currTail.height
                set([x + localX, y + localY], tile)
            })
        })

        return cabin
    }
}
