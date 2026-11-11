import { config } from '+config'
import { actorByType } from '+game/actors'
import { InstancedBuildingRenderer } from '+game/renderer/lib/InstancedBuildingRenderer'
import { ActorType } from '+game/types'
import { type Tile } from '+game/world/Tile'

import { AxesHelper } from 'three'

import { type StakewallActor } from './StakewallActor'
import { type StakewallBlueprint } from './StakewallBlueprint'

export class StakewallRenderer extends InstancedBuildingRenderer<StakewallActor> {
    public actorType = ActorType.Stakewall

    protected get buildingModel() {
        return (actorByType[ActorType.Stakewall].blueprint as StakewallBlueprint)
            .buildingModel
    }

    public createActorModel(actor: StakewallActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        if (config.debug.wireModel) {
            const ts = config.renderer.tileSize
            const midlePointHelper = new AxesHelper(ts * 2)
            group.add(midlePointHelper)
        }
        return { group, interactionShape }
    }
}
