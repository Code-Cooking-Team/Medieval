import { BuildingModel } from '+game/renderer/lib/BuildingModel'
import { type ActorBlueprint } from '+game/types'
import { type TileCodeGrid } from '+game/world/tileCodes'
import { loadGLTF } from '+helpers/three'

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

    public readonly buildingModel = new BuildingModel(barracksModel, [
        { node: 'lod_near', distanceInTiles: 0 },
        { node: 'lod_far', distanceInTiles: 100 },
    ])

    public getPlaceholder(seed?: number) {
        return this.buildingModel.createModel(seed)
    }

    public getGrid() {
        return this.grid
    }
}

export const barracksBlueprint = new BarracksBlueprint()
