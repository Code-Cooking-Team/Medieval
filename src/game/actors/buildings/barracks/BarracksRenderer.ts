import { config } from '+config'
import { actorByType } from '+game/actors'
import { InstancedBuildingRenderer } from '+game/renderer/lib/InstancedBuildingRenderer'
import { ActorType } from '+game/types'
import { type Tile } from '+game/world/Tile'

import { AxesHelper, PointLight } from 'three'

import { type BarracksActor } from './BarracksActor'
import { type BarracksBlueprint } from './BarracksBlueprint'

export class BarracksRenderer extends InstancedBuildingRenderer<BarracksActor> {
    public actorType = ActorType.Barracks

    protected get buildingModel() {
        return (actorByType[ActorType.Barracks].blueprint as BarracksBlueprint)
            .buildingModel
    }

    public createActorModel(actor: BarracksActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        const ts = config.renderer.tileSize

        if (config.renderer.light) {
            const light = new PointLight(0xfa840e, 5, 15 * ts)
            light.position.set(3 * ts, 7 * ts, 3 * ts)

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
