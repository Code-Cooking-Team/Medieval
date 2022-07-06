import { LumberjackActor } from '+game/actors/lumberjack/LumberjackActor'
import { LumberjackCabinActor } from '+game/actors/lumberjack/LumberjackCabinActor'

import { createTileGrid, Grid } from '../grid'
import { BuildingSpawner } from '../Spawner'

export class LumberjackCabinSpawner extends BuildingSpawner {
    public readonly grid: Grid = [
        ['.', '.', '.', '.', '.'],
        ['.', 'W', 'W', 'W', '.'],
        ['.', 'W', '!', 'W', '.'],
        ['.', 'W', '!', 'W', '.'],
        ['.', '.', '.', '.', '.'],
    ]

    public spawn() {
        const [x, y] = this.position
        const cabin = new LumberjackCabinActor(this.game, [x + 2, y + 2])
        // TODO remove lumberjack actor from here
        const lumberjack = new LumberjackActor(this.game, [x, y], cabin)

        this.game.addActor(cabin)
        this.game.addActor(lumberjack)

        const currTail = this.game.word.getTile([x, y])
        if (!currTail) {
            throw new Error(
                `[LumberjackCabinSpawner] Unable to spawn at ${x}x${y} position`,
            )
        }

        this.game.word.setMultipleTiles((set) => {
            createTileGrid(this.grid, ([localX, localY], tile) => {
                tile.height = currTail.height
                set([x + localX, y + localY], tile)
            })
        })

        return cabin
    }
}
