import { config } from '+config'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { Tile } from '+game/Tile'
import { ActorType } from '+game/types'
import { loadGLTF } from '+helpers'

import { LOD, PointLight } from 'three'

import { HouseActor } from './HouseActor'
import houseUrl from './models/house3.gltf'

const houseModel = loadGLTF(houseUrl)

export class HouseRenderer extends ActorRenderer<HouseActor> {
    public actorType = ActorType.House

    public createActorModel(actor: HouseActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        const lod = new LOD()
        houseModel.then((model) => {
            model.children.forEach((child, index) => {
                child.castShadow = true
                child.receiveShadow = true
                lod.addLevel(child.clone(), (model.children.length - index - 1) * 80)
            })
        })

        group.add(lod)

        if (config.renderer.light) {
            const light = new PointLight(0xfa840e, 1, 15)
            light.position.set(0, 3, 0)
            group.add(light)
        }

        return { group, interactionShape }
    }
}
