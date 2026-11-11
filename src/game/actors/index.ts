import { type Actor, type ActorClass, type ActorJSON } from '+game/core/Actor'
import { type Game } from '+game/Game'
import { type Player } from '+game/player/types'
import { type ActorBlueprint, ActorType } from '+game/types'

import { BarracksActor } from './buildings/barracks/BarracksActor'
import { BarracksRenderer } from './buildings/barracks/BarracksRenderer'
import { buildingBlueprints } from './buildings/construction/blueprints'
import { ConstructionSiteActor } from './buildings/construction/ConstructionSiteActor'
import { ConstructionSiteRenderer } from './buildings/construction/ConstructionSiteRenderer'
import { GuildhallActor } from './buildings/guildhall/GuildhallActor'
import { GuildhallRenderer } from './buildings/guildhall/GuildhallRenderer'
import { HouseActor } from './buildings/house/HouseActor'
import { HouseRenderer } from './buildings/house/HouseRenderer'
import { HunterHutActor } from './buildings/hunterHut/HunterHutActor'
import { HunterHutRenderer } from './buildings/hunterHut/HunterHutRenderer'
import { StakewallActor } from './buildings/stakewall/StakewallActor'
import { StakewallRenderer } from './buildings/stakewall/StakewallRenderer'
import { WoodCampActor } from './buildings/woodCamp/WoodCampActor'
import { WoodCampRenderer } from './buildings/woodCamp/WoodCampRenderer'
import { BushActor } from './flora/bush/BushActor'
import { BushRenderer } from './flora/bush/BushRenderer'
import { TreeActor } from './flora/tree/TreeActor'
import { TreeRenderer } from './flora/tree/TreeRenderer'
import { BoarActor } from './units/boars/BoarActor'
import { BoarRenderer } from './units/boars/BoarRenderer'
import { DeerActor } from './units/deer/DeerActor'
import { DeerRenderer } from './units/deer/DeerRenderer'
import { HumanActor } from './units/human/HumanActor'
import { HumanRenderer } from './units/human/HumanRenderer'

export const actorRenderers = [
    ConstructionSiteRenderer,
    GuildhallRenderer,
    HouseRenderer,
    HumanRenderer,
    WoodCampRenderer,
    HunterHutRenderer,
    BarracksRenderer,
    StakewallRenderer,
    BoarRenderer,
    DeerRenderer,
]

export const basicRenderers = [TreeRenderer, BushRenderer]

const emptyActor = () => {
    throw new Error(`[actorByType] Don't use empty actor`)
}

export const actorByType: Record<
    ActorType,
    { actorClass: ActorClass; blueprint?: ActorBlueprint }
> = {
    [ActorType.Empty]: emptyActor as any,
    [ActorType.ConstructionSite]: { actorClass: ConstructionSiteActor },
    [ActorType.Guildhall]: {
        actorClass: GuildhallActor,
        blueprint: buildingBlueprints[ActorType.Guildhall],
    },
    [ActorType.House]: {
        actorClass: HouseActor,
        blueprint: buildingBlueprints[ActorType.House],
    },
    [ActorType.HunterHut]: {
        actorClass: HunterHutActor,
        blueprint: buildingBlueprints[ActorType.HunterHut],
    },
    [ActorType.WoodCamp]: {
        actorClass: WoodCampActor,
        blueprint: buildingBlueprints[ActorType.WoodCamp],
    },
    [ActorType.Barracks]: {
        actorClass: BarracksActor,
        blueprint: buildingBlueprints[ActorType.Barracks],
    },
    [ActorType.Stakewall]: {
        actorClass: StakewallActor,
        blueprint: buildingBlueprints[ActorType.Stakewall],
    },
    [ActorType.Human]: {
        actorClass: HumanActor,
    },
    [ActorType.Tree]: {
        actorClass: TreeActor,
    },
    [ActorType.Bush]: {
        actorClass: BushActor,
    },
    [ActorType.Boar]: {
        actorClass: BoarActor,
    },
    [ActorType.Deer]: {
        actorClass: DeerActor,
    },
}

export const actorFromJSON = (json: ActorJSON, game: Game, player: Player): Actor => {
    const ActorClass = actorByType[json.type].actorClass
    const actor = new ActorClass(game, player)
    actor.fromJSON(json)
    return actor
}
