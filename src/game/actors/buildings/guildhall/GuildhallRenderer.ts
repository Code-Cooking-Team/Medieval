import { config } from '+config'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { ActorType, ClockInfo } from '+game/types'
import { Tile } from '+game/world/Tile'

import { AxesHelper, Object3D, PointLight, PointLightHelper } from 'three'

import { GuildhallActor } from './GuildhallActor'

export class GuildhallRenderer extends ActorRenderer<GuildhallActor> {
    public actorType = ActorType.Guildhall

    private fireModel: Object3D[] = []

    public createActorModel(actor: GuildhallActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        const model = actor.blueprint.getModel().clone()

        model.traverse((child) => {
            if (child instanceof Object3D && child.name.includes('fire')) {
                console.log('found fire')
                this.fireModel.push(child)
            }
        })

        group.add(model)

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

            const middlePointHelper = new AxesHelper(ts * 5)
            group.add(middlePointHelper)
        }

        group.add(light)
        // }

        return { group, interactionShape }
    }

    public render(clockInfo: ClockInfo): void {
        this.updatePosition(clockInfo)
        this.updateHP()
        this.updateSelect()
        this.fireModel.forEach((element) => {
            console.log('fire spin')
            element.rotation.y += Math.sin(clockInfo.deltaTime * 1) * Math.random() * 2
            element.scale.y = Math.sin(clockInfo.deltaTime * 20) + 1 / 1.7
            element.scale.x = Math.sin(clockInfo.deltaTime * 5) + 1 / 1.2
            element.scale.z = Math.sin(clockInfo.deltaTime * 3) + 1 / 1.2
        })
    }
}
