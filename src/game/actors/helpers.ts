import { Actor } from '+game/core/Actor'
import { BuildingActor } from '+game/core/BuildingActor'
import { WalkableActor } from '+game/core/WalkableActor'

import { HumanActor } from './units/human/HumanActor'

export const isHumanActor = (actor: Actor): actor is HumanActor => {
    return actor instanceof HumanActor
}

export const isBuildingActor = (actor: Actor): actor is BuildingActor => {
    return actor instanceof BuildingActor
}

export const isWalkableActor = (actor: Actor): actor is WalkableActor =>
    actor instanceof WalkableActor
