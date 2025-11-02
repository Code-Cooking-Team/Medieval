import { Actor, type ActorJSON } from '+game/core/Actor'
import { type ActorClass } from '+game/core/ActorClass'
import { type ActorLike } from '+game/core/ActorLike'
import { type GameLike } from '+game/GameLike'
import { type Player } from '+game/player/types'
import { type ActorBlueprint, ActorType } from '+game/types'

import { BarracksActor } from './buildings/barracks/BarracksActor'
import { barracksBlueprint } from './buildings/barracks/BarracksBlueprint'
import { BarracksRenderer } from './buildings/barracks/BarracksRenderer'
import { GuildhallActor } from './buildings/guildhall/GuildhallActor'
import { guildhallBlueprint } from './buildings/guildhall/GuildhallBlueprint'
import { GuildhallRenderer } from './buildings/guildhall/GuildhallRenderer'
import { HouseActor } from './buildings/house/HouseActor'
import { houseBlueprint } from './buildings/house/HouseBlueprint'
import { HouseRenderer } from './buildings/house/HouseRenderer'
import { StakewallActor } from './buildings/stakewall/StakewallActor'
import { stakewallBlueprint } from './buildings/stakewall/StakewallBlueprint'
import { StakewallRenderer } from './buildings/stakewall/StakewallRenderer'
import { WoodCampActor } from './buildings/woodCamp/WoodCampActor'
import { woodCampBlueprint } from './buildings/woodCamp/WoodCampBlueprint'
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
        blueprint: guildhallBlueprint,
    },
    [ActorType.House]: {
        actorClass: HouseActor,
        blueprint: houseBlueprint,
    },
    [ActorType.WoodCamp]: {
        actorClass: WoodCampActor,
        blueprint: woodCampBlueprint,
    },
    [ActorType.Barracks]: {
        actorClass: BarracksActor,
        blueprint: barracksBlueprint,
    },
    [ActorType.Stakewall]: {
        actorClass: StakewallActor,
        blueprint: stakewallBlueprint,
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

export const actorFromJSON = (
    json: ActorJSON,
    game: GameLike,
    player: Player,
): ActorLike => {
    const ActorClass = actorByType[json.type].actorClass
    const actor = new ActorClass(game, player)
    actor.fromJSON(json)
    return actor
}
