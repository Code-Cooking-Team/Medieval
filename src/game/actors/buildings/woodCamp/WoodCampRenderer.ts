import { config } from '+config'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'
import { loadGLTF } from '+helpers'

import { LOD, PointLight } from 'three'

import { WoodCampActor } from './WoodCampActor'
import { WoodCampModel } from './WoodCampModel'

export class WoodCampRenderer extends ActorRenderer<WoodCampActor> {
    public actorType = ActorType.WoodCamp

    public createActorModel(actor: WoodCampActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        if (config.renderer.light) {
            const light = new PointLight(0xfa840e, 2, 15)
            light.position.set(3, 2, 3)
            group.add(light)
        }

        const model = new WoodCampModel()

        group.add(model.getModel())

        return { group, interactionShape }
    }
}
