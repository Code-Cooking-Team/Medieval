import { config } from '+config'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { Tile } from '+game/Tile'
import { ActorType } from '+game/types'
import { loadGLTF } from '+helpers'

import {
    BoxGeometry,
    LOD,
    Mesh,
    MeshStandardMaterial,
    OctahedronGeometry,
    PointLight,
} from 'three'

import woodCampUrl from './models/woodCamp.gltf'
import { WoodCampActor } from './WoodCampActor'

const houseModel = loadGLTF(woodCampUrl)

export class WoodCampRenderer extends ActorRenderer<WoodCampActor> {
    public actorType = ActorType.WoodCamp

    public createActorModel(actor: WoodCampActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)
        const lod = new LOD()
        houseModel.then((model) => {
            model.children.forEach((child, index) => {
                child.castShadow = true
                child.receiveShadow = true

                lod.addLevel(child.clone(), (model.children.length - index - 1) * 80)
            })
        })

        if (config.renderer.light) {
            const light = new PointLight(0xfa840e, 1, 15)
            light.position.set(0, 3, 0)
            group.add(light)
        }

        lod.position.z = (actor.grid.length / 2) * config.renderer.tileSize
        lod.position.x = (actor.grid[0]!.length / 2) * config.renderer.tileSize

        group.add(lod)

        return { group, interactionShape }
    }
}
