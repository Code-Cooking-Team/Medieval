import { GuardianActor } from '+game/actors/guardian/GuardianActor'
import { TreeActor } from '+game/actors/tree/TreeActor'
import { Game } from '+game/Game'
import { OvergrownTile } from '+game/Tile'
import { ActorType } from '+game/types'

import { createSimpleSpawner } from './createSimpleSpawner'
import { HouseSpawner } from './list/HouseSpawner'
import { LumberjackCabinSpawner } from './list/LumberjackCabinSpawner'
import { Spawner } from './Spawner'

interface Instantiable<T> extends Function {
    new (game: Game): T
}

export const spawners: Partial<Record<ActorType, Instantiable<Spawner>>> = {
    [ActorType.LumberjackCabin]: LumberjackCabinSpawner,
    [ActorType.House]: HouseSpawner,
    [ActorType.Guardian]: createSimpleSpawner(GuardianActor),
    [ActorType.Tree]: createSimpleSpawner(TreeActor, OvergrownTile),
}

export const spawnList = Object.keys(spawners) as ActorType[]
