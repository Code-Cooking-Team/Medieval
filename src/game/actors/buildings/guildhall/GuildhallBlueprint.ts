import { BuildingModel } from '+game/renderer/lib/BuildingModel'
import { ActorBlueprint } from '+game/types'
import { TileCodeGrid } from '+game/world/tileCodes'
import { loadGLTF } from '+helpers'

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

    public readonly buildingModel = new BuildingModel(guildhallModel)
    private model = this.buildingModel.createModel().model

    public getModel() {
        return this.model
    }

    public getPlaceholder(seed?: number) {
        return this.buildingModel.createModel(seed)
    }

    public getGrid() {
        return this.grid
    }
}
