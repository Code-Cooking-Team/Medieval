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

        this.game.addActor(house)

        const currTail = this.game.word.getTile(this.position)
        if (!currTail) {
            throw new Error(`[HouseSpawner] Unable to spawn at ${x}x${y} position`)
        }

        this.game.word.setMultipleTiles((set) => {
            createTileGrid(this.grid, ([localX, localY], tile) => {
                tile.height = currTail.height
                set([x + localX, y + localY], tile)
            })
        })
    }
}
