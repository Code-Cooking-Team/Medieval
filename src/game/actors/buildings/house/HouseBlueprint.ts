import { BuildingModel } from '+game/renderer/lib/BuildingModel'
import { type ActorBlueprint, type Position } from '+game/types'
import { type TileCodeGrid } from '+game/world/tileCodes'
import { loadGLTF } from '+helpers/three'

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

    public readonly buildingModel = new BuildingModel(houseModel, [
        { node: 'lod1', distanceInTiles: 0 },
        { node: 'lod2', distanceInTiles: 100 },
        { node: 'lod3', distanceInTiles: 160 },
    ])

    public getPlaceholder(seed?: number) {
        return this.buildingModel.createModel(seed)
    }

    public getGrid() {
        return this.grid
    }
}

export const houseBlueprint = new HouseBlueprint()
