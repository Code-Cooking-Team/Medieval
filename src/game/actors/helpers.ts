import { type ActorLike } from '+game/core/ActorLike'
import { BuildingActor } from '+game/core/BuildingActor'
import { WalkableActor } from '+game/core/WalkableActor'

import { HumanActor } from './units/human/HumanActor'

export const isHumanActor = (actor: ActorLike): actor is HumanActor => {
    return actor instanceof HumanActor
}

export const isBuildingActor = (actor: ActorLike): actor is BuildingActor => {
    return actor instanceof BuildingActor
}

export const isWalkableActor = (actor: ActorLike): actor is WalkableActor =>
    actor instanceof WalkableActor
