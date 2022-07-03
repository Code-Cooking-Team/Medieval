import { Builder } from '+game/Builder'
import { Game } from '+game/Game'
import { ActorType } from '+game/types'
import { seededRandom } from '+helpers/random'

export class FloraSpawner {
    private builder: Builder

    constructor(public game: Game) {
        this.builder = new Builder(this.game)
    }

    public spawnTrees() {
        const rng = seededRandom(1234567)

        this.game.word.tiles.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile.treeChance !== 0 && rng() < tile.treeChance) {
                    this.builder.spawn(ActorType.Tree, [x, y])
                }
            })
        })
    }
}
