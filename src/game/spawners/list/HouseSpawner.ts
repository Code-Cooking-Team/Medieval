import { HouseActor } from '+game/actors/house/HouseActor'

import { createTileGrid, Grid } from '../grid'
import { BuildingSpawner } from '../Spawner'

export class HouseSpawner extends BuildingSpawner {
    public readonly grid: Grid = [
        ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
        ['.', 'W', 'W', 'W', 'W', 'W', 'W', '.', 'W'],
        ['.', 'W', '!', '!', '!', '!', 'W', 'W', '.'],
        ['.', 'W', '!', 'W', 'W', 'W', 'W', '.', 'W'],
        ['.', 'W', '!', 'W', '.', '.', '.', '.', '.'],
        ['.', 'W', '!', '!', '.', '.', '.', '.', '.'],
        ['.', 'W', '!', 'W', '.', '.', '.', '.', '.'],
        ['.', 'W', 'W', 'W', '.', '.', '.', '.', '.'],
        ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ]

    public spawn() {
        const [x, y] = this.position
        const house = new HouseActor(this.game, this.position)
        const currTail = this.game.word.getTile(this.position)

        this.game.addActor(house)

        this.game.word.setMultipleTiles((set) => {
            createTileGrid(this.grid, ([localX, localY], tile) => {
                tile.height = currTail.height
                set([x + localX, y + localY], tile)
            })
        })

        return house
    }
}
