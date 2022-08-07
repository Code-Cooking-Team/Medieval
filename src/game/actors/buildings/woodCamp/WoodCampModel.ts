import { config } from '+config'
import { ActorModel } from '+game/types'
import { loadGLTF } from '+helpers/three'

import { LOD } from 'three'

import woodCampUrl from './models/woodCamp.gltf'

const woodCampModel = loadGLTF(woodCampUrl)

export class WoodCampModel implements ActorModel {
    private model: LOD

    constructor() {
        const lod = new LOD()
        woodCampModel.then((model) => {
            model.children.forEach((child, index) => {
                lod.addLevel(child.clone(), (model.children.length - index - 1) * 80)
            })
        })

        lod.position.z = (8 / 2) * config.renderer.tileSize
        lod.position.x = (8 / 2) * config.renderer.tileSize

        this.model = lod
    }

    getModel() {
        return this.model
    }
}
