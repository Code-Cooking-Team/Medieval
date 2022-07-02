import { GuardianActor } from '+game/actors/guardian/GuardianActor'
import { Game } from '+game/Game'
import { ActorType } from '+game/types'

import { createUnitSpawner } from './createUnitSpawner'
import { LumberjackCabinSpawner } from './list/LumberjackCabinSpawner'
import { Spawner } from './Spawner'

interface Instantiable<T> extends Function {
    new (game: Game): T
}

export const spawners: Partial<Record<ActorType, Instantiable<Spawner>>> = {
    [ActorType.LumberjackCabin]: LumberjackCabinSpawner,
    [ActorType.Guardian]: createUnitSpawner(GuardianActor),
}

export const spawnList = Object.keys(spawners) as ActorType[]
