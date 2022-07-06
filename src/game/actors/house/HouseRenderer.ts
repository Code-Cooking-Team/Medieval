import { config } from '+config'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { Tile } from '+game/Tile'
import { ActorType } from '+game/types'
import { loadGLTF } from '+helpers/three'

import { PointLight } from 'three'

import { HouseActor } from './HouseActor'
import houseUrl from './models/house2.gltf'

const houseModel = loadGLTF(houseUrl)

export class HouseActorRenderer extends ActorRenderer<HouseActor> {
    public actorType = ActorType.House

    public createActorModel(actor: HouseActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        houseModel.then((model) => {
            model.children.forEach((child) => {
                child.castShadow = true
                child.receiveShadow = true
                // if (child.material) {
                //     child.material.metalness = 0
                // }
                model.position.x = 2
                model.position.z = 2
            })
            group.add(model.clone())
        })

        if (config.lumberjack.cabinLight) {
            const light = new PointLight(0xfa840e, 1, 15)
            light.position.set(0, 3, 0)
            group.add(light)
        }

        return { group, interactionShape }
    }
}
