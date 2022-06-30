import { StaticActor } from '+game/core/StaticActor'
import { ActorType } from '+game/types'

// TODO rename to LumberjackCabinActor
export class LumberjackCabinActor extends StaticActor {
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
