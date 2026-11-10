import { barracksBlueprint } from '+game/actors/buildings/barracks/BarracksBlueprint'
import { guildhallBlueprint } from '+game/actors/buildings/guildhall/GuildhallBlueprint'
import { houseBlueprint } from '+game/actors/buildings/house/HouseBlueprint'
import { hunterHutBlueprint } from '+game/actors/buildings/hunterHut/HunterHutBlueprint'
import { stakewallBlueprint } from '+game/actors/buildings/stakewall/StakewallBlueprint'
import { woodCampBlueprint } from '+game/actors/buildings/woodCamp/WoodCampBlueprint'
import { type ActorBlueprint, ActorType } from '+game/types'

import type { ConstructionType } from './costs'

export const buildingBlueprints = {
    [ActorType.Barracks]: barracksBlueprint,
    [ActorType.Guildhall]: guildhallBlueprint,
    [ActorType.House]: houseBlueprint,
    [ActorType.HunterHut]: hunterHutBlueprint,
    [ActorType.Stakewall]: stakewallBlueprint,
    [ActorType.WoodCamp]: woodCampBlueprint,
} satisfies Record<ConstructionType, ActorBlueprint>
