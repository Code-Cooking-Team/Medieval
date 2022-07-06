import { WaterRenderer } from '+game/renderer/WaterRenderer'

import { GuardianActorRenderer } from './guardian/GuardianActorRenderer'
import { HouseActorRenderer } from './house/HouseRenderer'
import { HumanActorRenderer } from './human/HumanActorRenderer'
import { LumberjackActorRenderer } from './lumberjack/LumberjackActorRenderer'
import { LumberjackCabinActorRenderer } from './lumberjack/LumberjackCabinActorRenderer'
import { TreeRenderer } from './tree/TreeRenderer'

export const actorRenderers = [
    HouseActorRenderer,
    GuardianActorRenderer,
    HumanActorRenderer,
    LumberjackActorRenderer,
    LumberjackCabinActorRenderer,
]

export const basicRenderers = [WaterRenderer, TreeRenderer]
