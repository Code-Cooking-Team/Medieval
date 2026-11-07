import { config } from '+config'
import { actorByType } from '+game/actors'
import { InstancedBuildingRenderer } from '+game/renderer/lib/InstancedBuildingRenderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'

import { AxesHelper, PointLight } from 'three'

import { WoodCampActor } from './WoodCampActor'
import { WoodCampBlueprint } from './WoodCampBlueprint'

export class WoodCampRenderer extends InstancedBuildingRenderer<WoodCampActor> {
    public actorType = ActorType.WoodCamp

    protected get buildingModel() {
        return (actorByType[ActorType.WoodCamp].blueprint as WoodCampBlueprint)
            .buildingModel
    }

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

        return { group, interactionShape }
    }
}
