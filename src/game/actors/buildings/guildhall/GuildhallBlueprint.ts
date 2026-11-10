import { BuildingModel } from '+game/renderer/lib/BuildingModel'
import { type ActorBlueprint } from '+game/types'
import { type TileCodeGrid } from '+game/world/tileCodes'
import { loadGLTF } from '+helpers/three'

import { applyGuildhallFlame } from './guildhallFlame'
import url from './models/guildhallv3.gltf'

const guildhallModel = loadGLTF(url).then(applyGuildhallFlame)

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

    public readonly buildingModel = new BuildingModel(guildhallModel, [
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

export const guildhallBlueprint = new GuildhallBlueprint()
