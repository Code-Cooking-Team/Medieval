import { Actor, ActorClass } from '+game/core/Actor'
import { ActorType } from '+game/types'

import { HouseActor } from './buildings/house/HouseActor'
import { HouseRenderer } from './buildings/house/HouseRenderer'
import { WoodCampActor } from './buildings/woodCamp/WoodCampActor'
import { WoodCampRenderer } from './buildings/woodCamp/WoodCampRenderer'
import { TreeActor } from './flora/tree/TreeActor'
import { TreeRenderer } from './flora/tree/TreeRenderer'
import { GuardianActor } from './units/guardian/GuardianActor'
import { GuardianRenderer } from './units/guardian/GuardianRenderer'
import { HumanActor } from './units/human/HumanActor'
import { HumanRenderer } from './units/human/HumanRenderer'

export const actorRenderers = [
    HouseRenderer,
    GuardianRenderer,
    HumanRenderer,
    WoodCampRenderer,
]

export const basicRenderers = [TreeRenderer]

const emptyActor = () => {
    throw new Error(`[actorByType] Don't use empty actor`)
}

export const actorByType: Record<ActorType, ActorClass<Actor>> = {
    [ActorType.Empty]: emptyActor as any,
    [ActorType.House]: HouseActor,
    [ActorType.Human]: HumanActor,
    [ActorType.Tree]: TreeActor,
    [ActorType.Guardian]: GuardianActor,
    [ActorType.WoodCamp]: WoodCampActor,
}
