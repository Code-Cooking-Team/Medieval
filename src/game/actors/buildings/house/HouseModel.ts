import { ActorModel } from '+game/types'
import { loadGLTF, updateScale } from '+helpers/three'

import { LOD } from 'three'

import houseUrl from './models/house.gltf'

const houseModel = loadGLTF(houseUrl)

export class HouseModel implements ActorModel {
    private model: LOD

    constructor() {
        const lod = new LOD()
        houseModel.then((model) => {
            model.children.forEach((child, index) => {
                lod.addLevel(child.clone(), (model.children.length - index - 1) * 80)
            })
        })

        updateScale(lod)

        this.model = lod
    }

    getModel() {
        return this.model
    }
}
