import { BuildingModel } from '+game/renderer/lib/BuildingModel'
import { ActorBlueprint, Position } from '+game/types'
import { TileCodeGrid } from '+game/world/tileCodes'
import { loadGLTF } from '+helpers'

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
        deliveryPoint: [2, 5] as Position,
    }

    public readonly buildingModel = new BuildingModel(woodCampModel)
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
