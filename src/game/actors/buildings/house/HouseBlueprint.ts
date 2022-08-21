import { ActorBlueprint, Position } from '+game/types'
import { TileCodeGrid } from '+game/world/tileCodes'
import { loadGLTF, updateScale } from '+helpers/three'

import { LOD } from 'three'

import houseUrl from './models/house.gltf'

const houseModel = loadGLTF(houseUrl)

export class HouseBlueprint implements ActorBlueprint {
    public grid: TileCodeGrid = [
        ['🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🦶🏽', '🧱', '🟢'],
        ['🟢', '🧱', '🛖', '🛖', '🛖', '🛖', '🧱', '🧱', '🦶🏽', '🟢'],
        ['🟢', '🧱', '🛖', '🛖', '🛖', '🛖', '🧱', '🧱', '🦶🏽', '🟢'],
        ['🟢', '🧱', '🛖', '🛖', '🧱', '🧱', '🧱', '🦶🏽', '🧱', '🟢'],
        ['🟢', '🧱', '🛖', '🛖', '🧱', '🦶🏽', '🦶🏽', '🦶🏽', '🟢', '🟢'],
        ['🟢', '🧱', '🛖', '🛖', '🦶🏽', '🦶🏽', '🦶🏽', '🟢', '🟢', '🟢'],
        ['🟢', '🧱', '🛖', '🛖', '🧱', '🦶🏽', '🦶🏽', '🟢', '🟢', '🟢'],
        ['🟢', '🧱', '🧱', '🧱', '🧱', '🦶🏽', '🟢', '🟢', '🟢', '🟢'],
        ['🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢', '🟢'],
    ]

    public height = 3

    public config = {
        spawnPoint: [3, 4] as Position,
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

        const promise = houseModel.then((model) => {
            model.children.forEach((child, index) => {
                lod.addLevel(child.clone(), (model.children.length - index - 1) * 80)
            })
        })

        updateScale(lod)

        return { model: lod, promise }
    }
}
