import { config } from '+config'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'

import { PointLight } from 'three'

import { GuildhallActor } from './GuildhallActor'

export class GuildhallRenderer extends ActorRenderer<GuildhallActor> {
    public actorType = ActorType.Guildhall

    public createActorModel(actor: GuildhallActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        const model = actor.blueprint.getModel()
        group.add(model.clone())

        const ts = config.renderer.tileSize

        // if (config.renderer.light) {
        const light = new PointLight(0xfa840e, 5, 15 * ts)
        light.position.set(3 * ts, 7 * ts, 3 * ts)

        // light.castShadow = true
        group.add(light)
        // }

        return { group, interactionShape }
    }
}
