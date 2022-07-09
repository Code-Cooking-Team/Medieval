import { Actor, ActorClass } from '+game/core/Actor'
import { ActorType } from '+game/types'

import { BarracksActor } from './buildings/barracks/BarracksActor'
import { BarracksRenderer } from './buildings/barracks/BarracksRenderer'
import { HouseActor } from './buildings/house/HouseActor'
import { HouseRenderer } from './buildings/house/HouseRenderer'
import { WoodCampActor } from './buildings/woodCamp/WoodCampActor'
import { WoodCampRenderer } from './buildings/woodCamp/WoodCampRenderer'
import { TreeActor } from './flora/tree/TreeActor'
import { TreeRenderer } from './flora/tree/TreeRenderer'
import { BoarActor } from './units/boars/BoarActor'
import { BoarRenderer } from './units/boars/BoarRenderer'
import { HumanActor } from './units/human/HumanActor'
import { HumanRenderer } from './units/human/HumanRenderer'

export const actorRenderers = [
    HouseRenderer,
    HumanRenderer,
    WoodCampRenderer,
    BarracksRenderer,
    BoarRenderer,
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
    [ActorType.WoodCamp]: WoodCampActor,
    [ActorType.Barracks]: BarracksActor,
    [ActorType.Boar]: BoarActor,
}
