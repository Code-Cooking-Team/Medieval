import { config } from '+config'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'

import { listenerAdded } from 'emittery'
import { AxesHelper, PointLight } from 'three'

import { WoodCampActor } from './WoodCampActor'

export class WoodCampRenderer extends ActorRenderer<WoodCampActor> {
    public actorType = ActorType.WoodCamp

    public createActorModel(actor: WoodCampActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        const ts = config.renderer.tileSize

        if (config.renderer.light) {
            const light = new PointLight(0xfa840e, 5, 15 * ts)
            light.position.set(1 * ts, 2 * ts, 1 * ts)
            light.castShadow = true
            group.add(light)
        }

        if (config.debug.wireModel) {
            const midlePointHelper = new AxesHelper(ts * 5)
            group.add(midlePointHelper)
        }

        const model = actor.blueprint.getModel()
        group.add(model.clone())

        return { group, interactionShape }
    }
}
