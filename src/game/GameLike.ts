import { Emitter } from '+lib/Emitter'

import { Actor, ActorClass } from './core/Actor'
import { Pathfinding } from './core/Pathfinding'
import { Player } from './player/types'
import { Position, ActorType } from './types'
import { World } from './world/World'

export interface GameLike {
    world: World
    pf: Pathfinding
    emitter: Emitter<{
        tick: undefined
        actorAdded: Actor
        actorRemoved: Actor
        started: undefined
        stopped: undefined
    }>
    removeActor(actor: Actor): void
    addActor(actor: Actor): void
    getActorById(id: string): Actor | undefined
    findActorByRange(
        position: Position,
        range: number,
        additionalCondition?: (actor: Actor) => boolean,
    ): Actor | undefined
    findActorsByType(type: ActorType, isAlive?: boolean): Actor[]
    findActorsByPosition(position: Position, range: number, isAlive?: boolean): Actor[]
    findClosestActorByType(
        type: ActorType,
        position: Position,
        isAlive?: boolean,
    ): Actor | undefined
    spawnActor<T extends Actor>(
        ActorClass: ActorClass<T>,
        player: Player,
        position: Position,
        rotation?: number,
    ): T | undefined
}
