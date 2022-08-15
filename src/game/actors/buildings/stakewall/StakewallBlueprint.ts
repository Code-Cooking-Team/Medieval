import { ActorBlueprint } from '+game/types'
import { TileCodeGrid } from '+game/world/tileCodes'
import { loadGLTF, updateScale } from '+helpers'

import { Group } from 'three'

import stakewallUrl from './models/wall.gltf'

const stakewallModel = loadGLTF(stakewallUrl)

export class StakewallBlueprint implements ActorBlueprint {
    public readonly grid: TileCodeGrid = [
        ['🟢', '🟢', '🟢'],
        ['🟢', '🧱', '🟢'],
        ['🟢', '🟢', '🟢'],
    ]

    public height = 4

    private model = this.loadModel().model

    private loadModel() {
        const group = new Group()

        const promise = stakewallModel.then((model) => {
            model.children.forEach((child) => {
                if (!child.name.includes('alt') || Math.random() > 0.5) {
                    group.add(child.clone())
                }
            })
        })

        updateScale(group)

        group.rotateY(Math.random() * Math.PI)

        return { model: group, promise }
    }

    public getModel() {
        return this.model
    }

    public getPlaceholder() {
        return this.loadModel()
    }

    public getGrid() {
        return this.grid
    }
}
