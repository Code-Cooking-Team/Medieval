import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'

import { StakewallActor } from './StakewallActor'
import { StakewallBlueprint } from './StakewallBlueprint'

export class StakewallRenderer extends ActorRenderer<StakewallActor> {
    public actorType = ActorType.Stakewall

    public createActorModel(actor: StakewallActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        const model = actor.blueprint.getModel()
        group.add(model.clone())

        return { group, interactionShape }
    }
}
