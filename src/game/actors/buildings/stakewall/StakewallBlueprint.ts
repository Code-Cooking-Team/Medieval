import { BuildingModel } from '+game/renderer/lib/BuildingModel'
import { type ActorBlueprint } from '+game/types'
import { type TileCodeGrid } from '+game/world/tileCodes'
import { seededRandom } from '+helpers/random'
import { loadGLTF } from '+helpers/three'

import { Mesh } from 'three'

import stakewallUrl from './models/wall.gltf'

const stakewallModel = loadGLTF(stakewallUrl).then((model) => {
    // Keep decorative posts within the blocked tile, even when the model rotates.
    model.traverse((node) => {
        if (!(node instanceof Mesh)) return
        const positions = node.geometry.getAttribute('position')
        let radius = 0
        for (let i = 0; i < positions.count; i++) {
            radius = Math.max(
                radius,
                Math.hypot(
                    positions.getX(i) * node.scale.x,
                    positions.getZ(i) * node.scale.z,
                ),
            )
        }
        if (radius <= 0.49) return
        node.scale.x *= 0.49 / radius
        node.scale.z *= 0.49 / radius
    })
    return model
})

export class StakewallBlueprint implements ActorBlueprint {
    public readonly grid: TileCodeGrid = [['🧱']]

    public height = 4

    public readonly buildingModel = new BuildingModel(
        stakewallModel,
        [
            { node: 'lod_near', distanceInTiles: 0 },
            { node: 'lod_far', distanceInTiles: 100 },
            { node: 'lod_very_far', distanceInTiles: 160 },
        ],
        (seed) => {
            const random = seededRandom(seed)
            const yaw = random(0, Math.PI * 2)
            const height = random(0.94, 1.06)
            const optional = Array.from({ length: 11 }, () => random() < 0.5)
            return (node) => {
                const name = node.name.replace(/_(?:very_)?far$/, '')
                if (name === 'Main') {
                    node.rotateY(yaw)
                    node.scale.y *= height
                    return true
                }
                return optional[Number(name.slice(3)) - 1] ?? false
            }
        },
    )

    public getPlaceholder(seed?: number) {
        return this.buildingModel.createModel(seed)
    }

    public getGrid() {
        return this.grid
    }
}

export const stakewallBlueprint = new StakewallBlueprint()
