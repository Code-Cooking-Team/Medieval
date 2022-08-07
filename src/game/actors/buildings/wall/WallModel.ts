import { ActorModel } from '+game/types'
import { loadGLTF } from '+helpers/three'

import { Group, LOD } from 'three'

import wallUrl from './models/wall.gltf'

const wallModel = loadGLTF(wallUrl)

export class WallModel implements ActorModel {
    private model: Group

    constructor() {
        const group = new Group()
        wallModel.then((model) => {
            model.children.forEach((child) => {
                if (!child.name.includes('alt') || Math.random() > 0.5) {
                    group.add(child.clone())
                }
            })
        })

        this.model = group
        this.model.rotateY(Math.random() * Math.PI)
    }

    getModel() {
        return this.model
    }
}
