import { TreeActor } from '+game/actors/tree/TreeActor'
import { OvergrownTile } from '+game/Tile'

import { BuildingSpawner } from '../Spawner'

export class TreeSpawner extends BuildingSpawner {
    public spawn() {
        const [x, y] = this.position
        const actor = new TreeActor(this.game, this.position)

        this.game.addActor(actor)

        this.game.word.setTiles((tiles) => {
            tiles[y]![x]! = new OvergrownTile()
        })
    }
}
