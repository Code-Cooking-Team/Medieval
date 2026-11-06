import { BuildingModel } from '+game/renderer/lib/BuildingModel'
import { ActorBlueprint } from '+game/types'
import { TileCodeGrid } from '+game/world/tileCodes'
import { loadGLTF, seededRandom } from '+helpers'

import stakewallUrl from './models/wall.gltf'

const stakewallModel = loadGLTF(stakewallUrl)

export class StakewallBlueprint implements ActorBlueprint {
    public readonly grid: TileCodeGrid = [
        ['🟢', '🟢', '🟢'],
        ['🟢', '🧱', '🟢'],
        ['🟢', '🟢', '🟢'],
    ]

    public height = 4

    public readonly buildingModel = new BuildingModel(stakewallModel, undefined, (seed) => {
        const random = seededRandom(seed)
        const yaw = random(0, Math.PI * 2)
        const height = random(0.94, 1.06)
        const optional = Array.from({ length: 11 }, () => random() < 0.5)
        return (node) => {
        if (node.name === 'Main') {
            node.rotateY(yaw)
            node.scale.y *= height
            return node
        }
        if (optional[Number(node.name.slice(3)) - 1]) return node
        }
    })

    public getPlaceholder(seed?: number) {
        return this.buildingModel.createModel(seed)
    }

    public getGrid() {
        return this.grid
    }
}
