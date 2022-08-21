import { BuildingActor } from '+game/core/BuildingActor'

import { ResidenceTrait, ResidenceTraitClass } from './ResidenceTrait'
import { BuildingTrait, BuildingTraitJSON, BuildingTraitType } from './types'

type BuildingTraitClass = ResidenceTraitClass

export const buildingTraitByType: Record<BuildingTraitType, BuildingTraitClass> = {
    [BuildingTraitType.Residence]: ResidenceTrait,
}

export const buildingTraitFromJSON = (
    json: BuildingTraitJSON,
    actor: BuildingActor,
): BuildingTrait => {
    const TraitClass = buildingTraitByType[json.type]

    if (!TraitClass) {
        throw new Error(`[BuildingActor] Unknown trait type: ${json.type}`)
    }

    const instance = new TraitClass(actor)
    instance.fromJSON(json as any)

    return instance
}
