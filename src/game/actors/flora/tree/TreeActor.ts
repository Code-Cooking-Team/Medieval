import { config } from '+config/config'
import { FloraSpawner } from '+game/actors/flora/FloraSpawner'
import { Actor } from '+game/core/Actor'
import { ActorType, Position } from '+game/types'
import { random, randomArrayItem, randomSeed } from '+helpers'

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
        const tile = this.game.world.getTile(this.position)
        if (tile.previousTile) {
            this.game.world.setTile(this.position, tile.previousTile)
        }
    }

    public spawnNewTree() {
        const newTreePosition = this.position.map(
            (pos) => randomArrayItem(config.tree.newTreeRange)! + pos,
        ) as Position

        if (!this.game.world.hasTile(newTreePosition)) return

        const tile = this.game.world.getTile(newTreePosition)

        const spawner = new FloraSpawner(this.game, this.player)
        spawner.spawnNewTree(tile, newTreePosition)
    }

    private treeCount() {
        return random(config.tree.newTreeTicksMin, config.tree.newTreeTicksMax)
    }
}
