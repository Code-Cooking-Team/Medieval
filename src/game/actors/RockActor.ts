import { Actor } from '../core/Actor'
import { ActorType } from '../types'
import { type RockSize } from '../world/rockPlacement'

export abstract class RockActor extends Actor {
    public abstract readonly size: RockSize
}

export class SmallRockActor extends RockActor {
    public type = ActorType.SmallRock
    public readonly size = 1
}

export class MediumRockActor extends RockActor {
    public type = ActorType.MediumRock
    public readonly size = 2
}

export class LargeRockActor extends RockActor {
    public type = ActorType.LargeRock
    public readonly size = 3
}
