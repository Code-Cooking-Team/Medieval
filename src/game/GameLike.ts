import { type Emitter } from '+lib/Emitter'

import { type ActorClass } from './core/ActorClass'
import { type ActorLike } from './core/ActorLike'
import { type Pathfinding } from './core/Pathfinding'
import { type Player } from './player/types'
import { type ActorType, type Position } from './types'
import { type World } from './world/World'

export interface GameLike {
    world: World
    pf: Pathfinding
    emitter: Emitter<{
        tick: undefined
        actorAdded: ActorLike
        actorRemoved: ActorLike
        started: undefined
        stopped: undefined
    }>
    removeActor(actor: ActorLike): void
    addActor(actor: ActorLike): void
    getActorById(id: string): ActorLike | undefined
    findActorByRange(
        position: Position,
        range: number,
        additionalCondition?: (actor: ActorLike) => boolean,
    ): ActorLike | undefined
    findActorsByType(type: ActorType, isAlive?: boolean): ActorLike[]
    findActorsByPosition(
        position: Position,
        range: number,
        isAlive?: boolean,
    ): ActorLike[]
    findClosestActorByType(
        type: ActorType,
        position: Position,
        isAlive?: boolean,
    ): ActorLike | undefined
    spawnActor<T extends ActorLike>(
        ActorClass: ActorClass<T>,
        player: Player,
        position: Position,
        rotation?: number,
    ): T | undefined
}
