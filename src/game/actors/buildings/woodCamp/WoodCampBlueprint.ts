import { ActorBlueprint, Position } from '+game/types'
import { TileCodeGrid } from '+game/world/tileCodes'
import { loadGLTF, updateScale } from '+helpers'

import { LOD } from 'three'

import woodCampUrl from './models/woodCamp.gltf'

const woodCampModel = loadGLTF(woodCampUrl)

export class WoodCampBlueprint implements ActorBlueprint {
    public readonly grid: TileCodeGrid = [
        ['🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🛖', '🧱', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🛖', '🧱', '🟢'],
        ['🟢', '🦶🏽', '🦶🏽', '🦶🏽', '🧱', '🛖', '🧱', '🟢'],
        ['🧱', '🧱', '🧱', '🦶🏽', '🧱', '🛖', '🧱', '🟢'],
        ['🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢'],
    ]

    public height = 3

    public config = {
        deliveryLocalPosition: [2, 5] as Position,
    }

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

        const promise = woodCampModel.then((model) => {
            model.children.forEach((child, index) => {
                lod.addLevel(child.clone(), (model.children.length - index - 1) * 80)
            })
        })

        updateScale(lod)

        return { model: lod, promise }
    }
}
