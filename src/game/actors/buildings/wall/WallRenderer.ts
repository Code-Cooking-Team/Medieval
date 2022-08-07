import { config } from '+config'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'
import { loadGLTF } from '+helpers'

import { WallActor } from './WallActor'
import { WallModel } from './WallModel'

export class WallRenderer extends ActorRenderer<WallActor> {
    public actorType = ActorType.Wall

    public createActorModel(actor: WallActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)
        const model = new WallModel()
        group.add(model.getModel())

        return { group, interactionShape }
    }
}
