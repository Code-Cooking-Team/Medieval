import { config } from '+config'
import { actorByType } from '+game/actors'
import { InstancedBuildingRenderer } from '+game/renderer/lib/InstancedBuildingRenderer'
import { ActorType, type ClockInfo } from '+game/types'
import { type Tile } from '+game/world/Tile'

import { AxesHelper, type Camera, PointLight } from 'three'

import { type GuildhallActor } from './GuildhallActor'
import { type GuildhallBlueprint } from './GuildhallBlueprint'
import { guildhallFlameTime } from './guildhallFlame'

export class GuildhallRenderer extends InstancedBuildingRenderer<GuildhallActor> {
    public actorType = ActorType.Guildhall

    protected get buildingModel() {
        return (actorByType[ActorType.Guildhall].blueprint as GuildhallBlueprint)
            .buildingModel
    }

    public render(clockInfo: ClockInfo, camera?: Camera) {
        guildhallFlameTime.value = clockInfo.elapsedTime
        super.render(clockInfo, camera)
    }

    public createActorModel(actor: GuildhallActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        const ts = config.renderer.tileSize

        const light = new PointLight(0xff982f, 3.5, 6 * ts)
        light.position.set(0, 0.9 * ts, 3 * ts)
        light.castShadow = config.renderer.shadow
        light.shadow.mapSize.setScalar(256)
        light.shadow.camera.near = ts
        light.shadow.camera.far = light.distance
        light.shadow.bias = -0.0001 * ts
        light.shadow.normalBias = 0.27 * ts

        if (config.debug.wireModel) {
            const lightHelper = new AxesHelper(ts)
            lightHelper.position.copy(light.position)
            group.add(lightHelper)

            const midlePointHelper = new AxesHelper(ts * 5)
            group.add(midlePointHelper)
        }

        group.add(light)

        return { group, interactionShape }
    }

    protected onRemoveActor(actor: GuildhallActor) {
        this.disposeHearthLight(actor)
        super.onRemoveActor(actor)
    }

    public destroy() {
        for (const actor of this.actorGroupMap.keys()) this.disposeHearthLight(actor)
        super.destroy()
    }

    private disposeHearthLight(actor: GuildhallActor) {
        this.actorGroupMap
            .get(actor)
            ?.children.find((child) => child instanceof PointLight)
            ?.dispose()
    }
}
