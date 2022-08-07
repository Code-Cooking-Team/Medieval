import { ActorModel } from '+game/types'
import { loadGLTF } from '+helpers/three'

import { Group, LOD } from 'three'

import stakewallUrl from './models/wall.gltf'

const stakewallModel = loadGLTF(stakewallUrl)

export class StakewallModel implements ActorModel {
    private model: Group

    constructor() {
        const group = new Group()
        stakewallModel.then((model) => {
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
