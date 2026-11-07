import { Actor } from '+game/core/Actor'
import { ActorType } from '+game/types'
import { TileType } from '+game/world/types'

export class BushActor extends Actor {
    public type = ActorType.Bush

    public static growsOn(type: TileType) {
        return type === TileType.Forest || type === TileType.Meadow
    }

    public override hit(_damage: number): number {
        return 0
    }
}
