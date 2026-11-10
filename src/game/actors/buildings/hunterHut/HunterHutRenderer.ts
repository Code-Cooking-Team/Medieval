import { actorByType } from '+game/actors'
import { InstancedBuildingRenderer } from '+game/renderer/lib/InstancedBuildingRenderer'
import { ActorType } from '+game/types'

import { type HunterHutActor } from './HunterHutActor'
import { type HunterHutBlueprint } from './HunterHutBlueprint'

export class HunterHutRenderer extends InstancedBuildingRenderer<HunterHutActor> {
    public actorType = ActorType.HunterHut

    protected get buildingModel() {
        return (actorByType[this.actorType].blueprint as HunterHutBlueprint).buildingModel
    }
}
