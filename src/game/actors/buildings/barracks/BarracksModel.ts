import { ActorModel } from '+game/types'
import { loadGLTF } from '+helpers/three'

import { Group, LOD } from 'three'

import houseUrl from './models/barracks.gltf'

const barracksModel = loadGLTF(houseUrl)

export class BarracksModel implements ActorModel {
    private model: LOD

    constructor() {
        const lod = new LOD()
        barracksModel.then((model) => {
            model.children.forEach((child, index) => {
                lod.addLevel(child.clone(), (model.children.length - index - 1) * 80)
            })
        })

        this.model = lod
    }

    getModel() {
        return this.model
    }
}
