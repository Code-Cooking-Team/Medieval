import { ActorBlueprint } from '+game/types'
import { TileCodeGrid } from '+game/world/tileCodes'
import { loadGLTF, updateScale } from '+helpers'

import { LOD } from 'three'

import url from './models/barracks.gltf'

const barracksModel = loadGLTF(url)

export class BarracksBlueprint implements ActorBlueprint {
    // prettier-ignore
    public grid: TileCodeGrid = [
        ['🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🛖', '🦶🏽', '🛖', '🛖', '🛖', '🦶🏽', '🦶🏽', '🟢', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🛖', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🟢', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🛖', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🟢', '🟢', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🛖', '🦶🏽', '🦶🏽', '🦶🏽', '🦶🏽', '🟢', '🟢', '🟢', '🟢'],
        ['🟢', '🧱', '🛖', '🧱', '🦶🏽', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢'],
        ['🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢'],
    ]

    public height = 4

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
        const lod = new LOD()

        const promise = barracksModel.then((model) => {
            model.children.forEach((child, index) => {
                lod.addLevel(child.clone(), (model.children.length - index - 1) * 80)
            })
        })

        updateScale(lod)

        return { model: lod, promise }
    }
}
