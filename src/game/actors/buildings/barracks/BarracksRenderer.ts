import { config } from '+config'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'
import { loadGLTF } from '+helpers'

import { LOD, PointLight } from 'three'

import { BarracksActor } from './BarracksActor'
import { BarracksModel } from './BarracksModel'

export class BarracksRenderer extends ActorRenderer<BarracksActor> {
    public actorType = ActorType.Barracks

    public createActorModel(actor: BarracksActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        const model = new BarracksModel()

        if (config.renderer.light) {
            const light = new PointLight(0xfa840e, 2, 15)
            light.position.set(3, 7, 3)
            group.add(light)
        }

        group.add(model.getModel())

        return { group, interactionShape }
    }
}
