import { Game } from '+game/Game'
import { Position } from '+game/types'

import { Spawner } from './Spawner'

export const createSimpleSpawner = (ActorClass: any, TileClass?: any) => {
    return class SimpleSpawner implements Spawner {
        public position: Position = [0, 0]

        constructor(public game: Game) {}

        public setPosition(position: Position) {
            this.position = position
        }

        public canSpawn() {
            const tile = this.game.word.getTile(this.position)
            return tile?.canWalk
        }

        public spawn() {
            const actor = new ActorClass(this.game, this.position)
            this.game.addActor(actor)

            if (TileClass) {
                const tile = this.game.word.getTile(this.position)
                this.game.word.setTile(this.position, new TileClass(tile))
            }

            return actor
        }
    }
}