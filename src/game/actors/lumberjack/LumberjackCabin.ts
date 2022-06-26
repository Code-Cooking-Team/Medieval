import { ActorStatic } from '+game/core/ActorStatic'
import { ActorType } from '+game/types'

// TODO rename to LumberjackCabinActor
export class LumberjackCabin extends ActorStatic {
    public type = ActorType.LumberjackCabin

    private collectedRawTreeHP = 0

    public collectRawTree(hp: number) {
        this.collectedRawTreeHP += hp
    }

    public debug() {
        const title = super.debug()
        return `${title}\ntree: ${Math.round(this.collectedRawTreeHP)}`
    }
}
