import { type BuildingActor } from '+game/core/BuildingActor'

import { ResidenceTrait, type ResidenceTraitClass } from './ResidenceTrait'
import { type BuildingTrait, type BuildingTraitJSON, BuildingTraitType } from './types'

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
