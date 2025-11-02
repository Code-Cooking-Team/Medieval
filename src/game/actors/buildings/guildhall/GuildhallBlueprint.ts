import { ActorBlueprint } from '+game/types'
import { TileCodeGrid } from '+game/world/tileCodes'
import { loadGLTF, updateScale } from '+helpers'

import { Group, LOD } from 'three'

import url from './models/guildhallv3.gltf'

const guildhallModel = loadGLTF(url)

export class GuildhallBlueprint implements ActorBlueprint {
    // prettier-ignore
    public grid: TileCodeGrid = [
        ['🟢', '🟢', '🟢', '🟢', '🦶🏽', '🦶🏽', '🦶🏽', '🟢', '🟢', '🟢', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🛖', '🧱', '🧱', '🧱', '🧱', '🟢'],
        ['🟢', '🧱', '🛖', '🛖', '🛖', '🛖', '🛖', '🛖', '🛖', '🧱', '🟢'],
        ['🟢', '🧱', '🛖', '🛖', '🛖', '🛖', '🛖', '🛖', '🛖', '🧱', '🟢'],
        ['🟢', '🧱', '🛖', '🛖', '🛖', '🛖', '🛖', '🛖', '🛖', '🧱', '🟢'],
        ['🟢', '🧱', '🛖', '🛖', '🛖', '🛖', '🛖', '🛖', '🛖', '🧱', '🟢'],
        ['🟢', '🧱', '🛖', '🛖', '🛖', '🛖', '🛖', '🛖', '🛖', '🧱', '🟢'], 
        ['🟢', '🧱', '🛖', '🧱', '🧱', '🧱', '🧱', '🧱', '🛖', '🧱', '🟢'], 
        ['🟢', '🧱', '🛖', '🧱', '🦶🏽', '🧱', '🦶🏽', '🧱', '🛖', '🧱', '🟢'], 
        ['🟢', '🧱', '🛖', '🧱', '🦶🏽', '🧱', '🦶🏽', '🧱', '🛖', '🧱', '🟢'], 
        ['🟢', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🟢'], 
        ['🟢', '🟢', '🟢', '🟢', '🦶🏽', '🦶🏽', '🦶🏽', '🟢', '🟢', '🟢', '🟢'], 
    ]

    public height = 6

    private model = this.loadModel().model

    public getModel() {
        return this.model
    }

    public getPlaceholder() {
        return this.loadModel()
    }

    public getGrid() {
        return this.grid
    }

    private loadModel() {
        const group = new Group()

        const promise = guildhallModel.then((model) => {
            model.children.forEach((child, index) => {
                group.add(child.clone())
            })
        })

        updateScale(group)

        return { model: group, promise }
    }
}

export const guildhallBlueprint = new GuildhallBlueprint()
