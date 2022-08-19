import { Actor, ActorClass, ActorJSON } from '+game/core/Actor'
import { Game } from '+game/Game'
import { Player } from '+game/player/types'
import { ActorBlueprint, ActorType } from '+game/types'

import { BarracksActor } from './buildings/barracks/BarracksActor'
import { BarracksBlueprint } from './buildings/barracks/BarracksBlueprint'
import { BarracksRenderer } from './buildings/barracks/BarracksRenderer'
import { GuildhallActor } from './buildings/guildhall/GuildhallActor'
import { GuildhallBlueprint } from './buildings/guildhall/GuildhallBlueprint'
import { GuildhallRenderer } from './buildings/guildhall/GuildhallRenderer'
import { HouseActor } from './buildings/house/HouseActor'
import { HouseBlueprint } from './buildings/house/HouseBlueprint'
import { HouseRenderer } from './buildings/house/HouseRenderer'
import { StakewallActor } from './buildings/stakewall/StakewallActor'
import { StakewallBlueprint } from './buildings/stakewall/StakewallBlueprint'
import { StakewallRenderer } from './buildings/stakewall/StakewallRenderer'
import { WoodCampActor } from './buildings/woodCamp/WoodCampActor'
import { WoodCampBlueprint } from './buildings/woodCamp/WoodCampBlueprint'
import { WoodCampRenderer } from './buildings/woodCamp/WoodCampRenderer'
import { TreeActor } from './flora/tree/TreeActor'
import { TreeRenderer } from './flora/tree/TreeRenderer'
import { BoarActor } from './units/boars/BoarActor'
import { BoarRenderer } from './units/boars/BoarRenderer'
import { HumanActor } from './units/human/HumanActor'
import { HumanRenderer } from './units/human/HumanRenderer'

export const actorRenderers = [
    GuildhallRenderer,
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
    { actorClass: ActorClass; blueprint?: ActorBlueprint }
> = {
    [ActorType.Empty]: emptyActor as any,
    [ActorType.Guildhall]: {
        actorClass: GuildhallActor,
        blueprint: new GuildhallBlueprint(),
    },
    [ActorType.House]: {
        actorClass: HouseActor,
        blueprint: new HouseBlueprint(),
    },
    [ActorType.WoodCamp]: {
        actorClass: WoodCampActor,
        blueprint: new WoodCampBlueprint(),
    },
    [ActorType.Barracks]: {
        actorClass: BarracksActor,
        blueprint: new BarracksBlueprint(),
    },
    [ActorType.Stakewall]: {
        actorClass: StakewallActor,
        blueprint: new StakewallBlueprint(),
    },
    [ActorType.Human]: {
        actorClass: HumanActor,
    },
    [ActorType.Tree]: {
        actorClass: TreeActor,
    },
    [ActorType.Boar]: {
        actorClass: BoarActor,
    },
}

export const actorFromJSON = (json: ActorJSON, game: Game, player: Player): Actor => {
    const ActorClass = actorByType[json.type].actorClass
    const actor = new ActorClass(game, player)
    actor.fromJSON(json)
    return actor
}
