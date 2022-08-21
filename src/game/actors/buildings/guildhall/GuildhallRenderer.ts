import { config } from '+config'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'

import { AxesHelper, PointLight, PointLightHelper } from 'three'

import { GuildhallActor } from './GuildhallActor'

export class GuildhallRenderer extends ActorRenderer<GuildhallActor> {
    public actorType = ActorType.Guildhall

    public createActorModel(actor: GuildhallActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        const model = actor.blueprint.getModel()
        group.add(model.clone())

        const ts = config.renderer.tileSize

        // if (config.renderer.light) {
        const light = new PointLight(0xfa840e, 5, 20 * ts)
        light.position.set(0 * ts, 1 * ts, 3 * ts)

        light.castShadow = true
        light.shadow.mapSize.width = 128 * 5
        light.shadow.mapSize.height = 128 * 5
        light.shadow.camera.near = 1 * ts
        light.shadow.camera.far = 20 * ts

        light.shadow.bias = -0.0001 * config.renderer.tileSize
        light.shadow.normalBias = 0.27 * config.renderer.tileSize

        if (config.debug.wireModel) {
            const lightHelper = new AxesHelper(ts)
            lightHelper.position.copy(light.position)
            group.add(lightHelper)

            const midlePointHelper = new AxesHelper(ts * 5)
            group.add(midlePointHelper)
        }

        group.add(light)
        // }

        return { group, interactionShape }
    }
}
