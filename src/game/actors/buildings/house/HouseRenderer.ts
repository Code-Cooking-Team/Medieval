import { config } from '+config'
import { actorByType } from '+game/actors'
import { InstancedBuildingRenderer } from '+game/renderer/lib/InstancedBuildingRenderer'
import { ActorType } from '+game/types'
import { type Tile } from '+game/world/Tile'

import { AxesHelper, PointLight } from 'three'

import { type HouseActor } from './HouseActor'
import { type HouseBlueprint } from './HouseBlueprint'

export class HouseRenderer extends InstancedBuildingRenderer<HouseActor> {
    public actorType = ActorType.House

    protected get buildingModel() {
        return (actorByType[ActorType.House].blueprint as HouseBlueprint).buildingModel
    }

    public createActorModel(actor: HouseActor, tile: Tile) {
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
