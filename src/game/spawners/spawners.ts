import { GuardianActor } from '+game/actors/guardian/GuardianActor'
import { Game } from '+game/Game'
import { ActorType } from '+game/types'

import { createUnitSpawner } from './createUnitSpawner'
import { HouseSpawner } from './list/HouseSpawner'
import { LumberjackCabinSpawner } from './list/LumberjackCabinSpawner'
import { TreeSpawner } from './list/TreeSpawner'
import { Spawner } from './Spawner'

interface Instantiable<T> extends Function {
    new (game: Game): T
}

export const spawners: Partial<Record<ActorType, Instantiable<Spawner>>> = {
    [ActorType.LumberjackCabin]: LumberjackCabinSpawner,
    [ActorType.House]: HouseSpawner,
    [ActorType.Guardian]: createUnitSpawner(GuardianActor),
    [ActorType.Tree]: TreeSpawner,
}

export const spawnList = Object.keys(spawners) as ActorType[]
