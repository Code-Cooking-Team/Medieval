import { type BuildingSurface } from '+game/core/buildingSurfaces'
import { BuildingModel } from '+game/renderer/lib/BuildingModel'
import { type ActorBlueprint } from '+game/types'
import { type TileCodeGrid } from '+game/world/tileCodes'
import { loadGLTF } from '+helpers/three'

import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'

import { applyGuildhallFlame } from './guildhallFlame'
import url from './models/guildhallv3.gltf'

// Two separate routes leave the rear entrance and center aisle clear.
const sideRoutes = [-2, 2].flatMap((x, side): BuildingSurface[] => {
    const first = side * 5
    return [
        { offset: [x, 0], height: 0.97, exits: [[x / 2, 0]], links: [first + 1] },
        { offset: [x, -1], height: 1.95, links: [first, first + 2] },
        // The top tread crosses the low rail at the edge of the existing loft.
        { offset: [x, -2], height: 2.93, links: [first + 1, first + 3] },
        {
            offset: [x, -3],
            height: 2.41,
            group: 'loft',
            links: [first + 2, first + 4, 12 + side],
        },
        { offset: [x, -4], height: 2.41, group: 'loft', links: [first + 3, 10 + side] },
    ]
})
const guildhallModel = loadGLTF(url)
    .then(applyGuildhallFlame)
    .then((root) => {
        const material = new MeshStandardMaterial({ color: 0x60442e })
        const stairs = new Group()
        for (const [
            index,
            {
                offset: [x, z],
                height,
            },
        ] of sideRoutes.entries()) {
            if (index % 5 >= 3) continue
            for (let step = -2; step <= 2; step++) {
                const rise = height + step * (index % 5 === 2 && step > 0 ? 0 : 0.19)
                const tread = new Mesh(new BoxGeometry(0.86, rise + 0.08, 0.2), material)
                tread.position.set(x, (rise - 0.08) / 2, z - step * 0.2)
                tread.castShadow = tread.receiveShadow = true
                stairs.add(tread)
            }
        }
        for (const name of ['lod_near', 'lod_far'])
            root.getObjectByName(name)?.add(stairs.clone())
        return root
    })

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

    public readonly standingSurfaces: BuildingSurface[] = [
        ...sideRoutes,
        { offset: [-1, -4], height: 2.41, group: 'loft', links: [4, 12, 14] },
        { offset: [1, -4], height: 2.41, group: 'loft', links: [9, 13, 14] },
        { offset: [-1, -3], height: 2.41, group: 'loft', links: [3, 10] },
        { offset: [1, -3], height: 2.41, group: 'loft', links: [8, 11] },
        { offset: [0, -4], height: 2.41, group: 'loft', links: [10, 11] },
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
