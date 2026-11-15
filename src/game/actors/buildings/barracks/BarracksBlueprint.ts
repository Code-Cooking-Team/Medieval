import { type BuildingSurface } from '+game/core/buildingSurfaces'
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

    // East entrance: low ramp tread and the raised landing on the model.
    public readonly standingSurfaces: BuildingSurface[] = [
        { offset: [5, -3], height: 0.28, exits: [[6, -3]], links: [1] },
        { offset: [4, -3], height: 0.96, links: [0, 2] },
        { offset: [4, -2], height: 0.96, links: [1] },
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
