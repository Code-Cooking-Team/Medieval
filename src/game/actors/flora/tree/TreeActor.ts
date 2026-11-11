import { config } from '+config/config'
import { Actor } from '+game/core/Actor'
import { ActorType, type Position } from '+game/types'
import { randomArrayItem } from '+helpers/array'
import { random, randomSeed } from '+helpers/random'

import { canGrowTree } from './canGrowTree'

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

        const tile = this.game.world.hasTile(newTreePosition)
        if (tile && canGrowTree(this.game, tile, newTreePosition, Math.random)) {
            this.game.spawnActor(TreeActor, this.player, newTreePosition)
        }
    }

    private treeCount() {
        return random(config.tree.newTreeTicksMin, config.tree.newTreeTicksMax)
    }
}
