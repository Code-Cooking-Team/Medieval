import { Actor, ActorClass, ActorJSON } from '+game/core/Actor'
import { Game } from '+game/Game'
import { Player } from '+game/player/types'
import { ActorModel, ActorType } from '+game/types'

import { BarracksActor } from './buildings/barracks/BarracksActor'
import { BarracksModel } from './buildings/barracks/BarracksModel'
import { BarracksRenderer } from './buildings/barracks/BarracksRenderer'
import { HouseActor } from './buildings/house/HouseActor'
import { HouseModel } from './buildings/house/HouseModel'
import { HouseRenderer } from './buildings/house/HouseRenderer'
import { StakewallActor } from './buildings/stakewall/StakewallActor'
import { StakewallModel } from './buildings/stakewall/StakewallModel'
import { StakewallRenderer } from './buildings/stakewall/StakewallRenderer'
import { WoodCampActor } from './buildings/woodCamp/WoodCampActor'
import { WoodCampModel } from './buildings/woodCamp/WoodCampModel'
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
    StakewallRenderer,
    BoarRenderer,
]

export const basicRenderers = [TreeRenderer]

const emptyActor = () => {
    throw new Error(`[actorByType] Don't use empty actor`)
}

export const actorByType: Record<
    ActorType,
    { actorClass: ActorClass; model?: ActorModel }
> = {
    [ActorType.Empty]: emptyActor as any,
    [ActorType.House]: { actorClass: HouseActor, model: new HouseModel() },
    [ActorType.Human]: { actorClass: HumanActor },
    [ActorType.Tree]: { actorClass: TreeActor },
    [ActorType.WoodCamp]: { actorClass: WoodCampActor, model: new WoodCampModel() },
    [ActorType.Barracks]: { actorClass: BarracksActor, model: new BarracksModel() },
    [ActorType.Boar]: { actorClass: BoarActor },
    [ActorType.Stakewall]: { actorClass: StakewallActor, model: new StakewallModel() },
}

export const actorFromJSON = (json: ActorJSON, game: Game, player: Player): Actor => {
    const ActorClass = actorByType[json.type].actorClass
    const actor = new ActorClass(game, player)
    actor.fromJSON(json)
    return actor
}
