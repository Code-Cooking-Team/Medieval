import { config } from '+config'
import { actorByType } from '+game/actors'
import { InstancedBuildingRenderer } from '+game/renderer/lib/InstancedBuildingRenderer'
import { ActorType } from '+game/types'
import { type Tile } from '+game/world/Tile'

import { AxesHelper, PointLight } from 'three'

import { type WoodCampActor } from './WoodCampActor'
import { type WoodCampBlueprint } from './WoodCampBlueprint'

export class WoodCampRenderer extends InstancedBuildingRenderer<WoodCampActor> {
    public actorType = ActorType.WoodCamp

    protected get buildingModel() {
        return (actorByType[ActorType.WoodCamp].blueprint as WoodCampBlueprint)
            .buildingModel
    }

    protected getModelState(actor: WoodCampActor): number {
        if (actor.woodStock <= 0) return 0
        if (actor.woodStock >= actor.woodCapacity * 0.8) return 3
        return actor.woodStock < actor.woodCapacity / 2 ? 1 : 2
    }

    protected getActorPrimitives(actor: WoodCampActor, level: number, state: number) {
        return super
            .getActorPrimitives(actor, level, state)
            .filter(({ stockLayer }) => stockLayer === undefined || stockLayer <= state)
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
