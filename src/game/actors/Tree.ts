import { treeConfig } from '+config'
import { ActorStatic } from '+game/core/ActorStatic'
import { ActorType, Position } from '+game/types'
import { randomArrayItem } from '+helpers/array'
import { randomNumber } from '+helpers/basic'

export class Tree extends ActorStatic {
    public type = ActorType.Tree
    public maxHp = treeConfig.hp

    private newTreeCount = this.treeCount()

    public tick(): void {
        this.newTreeCount--
        if (this.newTreeCount <= 0) {
            this.newTreeCount = this.treeCount()

            this.plantNewTree()
        }
    }

    public plantNewTree() {
        const newTreePosition = this.position.map(
            (pos) => randomArrayItem(treeConfig.newTreeRange) + pos,
        ) as Position

        const tile = this.game.word.getTile(newTreePosition)

        if (!tile?.walkable) return

        this.game.addActor(new Tree(this.game, newTreePosition))
    }

    private treeCount() {
        const { min, max } = treeConfig.newTreeTicks
        return randomNumber(min, max)
    }
}
