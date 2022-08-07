import { config } from '+config'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'
import { loadGLTF } from '+helpers'

import { StakewallActor } from './StakewallActor'
import { StakewallModel } from './StakewallModel'

export class StakewallRenderer extends ActorRenderer<StakewallActor> {
    public actorType = ActorType.Stakewall

    public createActorModel(actor: StakewallActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)
        const model = new StakewallModel()
        group.add(model.getModel())

        return { group, interactionShape }
    }
}
