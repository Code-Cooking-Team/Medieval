import { Actor } from '+game/core/Actor'
import { ActorType } from '+game/types'

export class LumberjackCabin extends Actor {
    public type = ActorType.LumberjackCabin

    private collectedRawTreeHP = 0
    private collectedReadyTreeHP = 0

    public collectRawTree(hp: number) {
        this.collectedRawTreeHP += hp
    }

    public woodPlaning(hp: number) {
        this.collectedRawTreeHP -= hp
        this.collectedReadyTreeHP += hp
    }
}
