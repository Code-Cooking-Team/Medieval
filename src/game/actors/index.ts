import { WaterRenderer } from '+game/renderer/WaterRenderer'

import { GuardianActorRenderer } from './guardian/GuardianActorRenderer'
import { HouseActorRenderer } from './house/HouseRenderer'
import { HumanActorRenderer } from './human/HumanActorRenderer'
import { TreeRenderer } from './tree/TreeRenderer'
import { WoodCampRenderer } from './woodCamp/WoodCampRenderer'

export const actorRenderers = [
    HouseActorRenderer,
    GuardianActorRenderer,
    HumanActorRenderer,
    WoodCampRenderer,
]

export const basicRenderers = [WaterRenderer, TreeRenderer]
