import { config } from '+config'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'

import { PointLight } from 'three'

import { HouseActor } from './HouseActor'

export class HouseRenderer extends ActorRenderer<HouseActor> {
    public actorType = ActorType.House

    public createActorModel(actor: HouseActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        const model = actor.blueprint.getModel()
        group.add(model.clone())

        if (config.renderer.light) {
            const light = new PointLight(0xfa840e, 2, 15)
            light.position.set(3, 2, 3)
            group.add(light)
        }

        return { group, interactionShape }
    }
}
