import { config } from '+config/config'
import { Actor } from '+game/core/Actor'
import { FloraSpawner } from '+game/spawners/initial/FloraSpawner'
import { ActorType, Position } from '+game/types'
import { randomArrayItem } from '+helpers/array'
import { random } from '+helpers/basic'
import { randomSeed } from '+helpers/random'

export class TreeActor extends Actor {
    public type = ActorType.Tree
    public selectImportance = 2
    public maxHp = config.tree.hp
    public hp = config.tree.hp
    public seed = randomSeed()

    private newTreeCount = this.treeCount()
    private removeCount = config.tree.removeTickCount

    public tick(): void {
        this.newTreeCount--
        if (this.newTreeCount <= 0) {
            this.newTreeCount = this.treeCount()

            this.spawnNewTree()
        }

        if (this.isDead()) {
            this.removeCount--
            if (this.removeCount <= 0) this.game.removeActor(this)
        }
    }

    public death() {
        const tile = this.game.word.getTile(this.position)
        if (tile.previousTile) {
            this.game.word.setTile(this.position, tile.previousTile)
        }
    }

    public spawnNewTree() {
        const newTreePosition = this.position.map(
            (pos) => randomArrayItem(config.tree.newTreeRange)! + pos,
        ) as Position

        if (!this.game.word.hasTile(newTreePosition)) return

        const tile = this.game.word.getTile(newTreePosition)

        const spawner = new FloraSpawner(this.game)
        spawner.spawnNewTree(tile, newTreePosition)
    }

    private treeCount() {
        return random(config.tree.newTreeTicksMin, config.tree.newTreeTicksMax)
    }
}
