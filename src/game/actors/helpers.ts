import { Actor } from '+game/core/Actor'
import { BuildingActor } from '+game/core/BuildingActor'
import { WalkableActor } from '+game/core/WalkableActor'
import type { WoodStorageBuilding } from '+game/core/WoodStorageBuilding'
import { ActorType } from '+game/types'

import type { GuildhallActor } from './buildings/guildhall/GuildhallActor'
import type { HunterHutActor } from './buildings/hunterHut/HunterHutActor'
import type { WoodCampActor } from './buildings/woodCamp/WoodCampActor'
import { HumanActor } from './units/human/HumanActor'

export const isHumanActor = (actor: Actor): actor is HumanActor => {
    return actor instanceof HumanActor
}

export const isBuildingActor = (actor: Actor): actor is BuildingActor => {
    return actor instanceof BuildingActor
}

export const isWalkableActor = (actor: Actor): actor is WalkableActor =>
    actor instanceof WalkableActor

export const isWoodCampActor = (actor: Actor): actor is WoodCampActor =>
    actor.type === ActorType.WoodCamp

export const isGuildhallActor = (actor: Actor): actor is GuildhallActor =>
    actor.type === ActorType.Guildhall

export const hasWoodStorage = (actor: Actor): actor is WoodStorageBuilding =>
    isWoodCampActor(actor) || isGuildhallActor(actor)

export const isHunterHutActor = (actor: Actor): actor is HunterHutActor =>
    actor.type === ActorType.HunterHut
