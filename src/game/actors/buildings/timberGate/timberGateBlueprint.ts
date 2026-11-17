import { type BuildingSurface } from '+game/core/buildingSurfaces'
import { TIMBER_GALLERY_HEIGHT as deckHeight } from '+game/core/StandingSurfaces'
import { BuildingModel } from '+game/renderer/lib/BuildingModel'
import { type ActorBlueprint } from '+game/types'
import { type TileCodeGrid } from '+game/world/tileCodes'

import { Group } from 'three'

import { boards, brace, iron, plank, timberDeck } from '../timberModel'

const leafName = (side: number) => `gate-leaf-${side}`

export function poseGateLeaves(model: Group, openness: number) {
    for (const side of [-1, 1]) {
        const leaf = model.getObjectByName(leafName(side))
        if (leaf) leaf.rotation.y = -side * (Math.PI * (1 - openness) + 0.12 * openness)
    }
}

function gateModel() {
    const model = new Group()
    timberDeck(model, 3, deckHeight)
    plank(model, 3, 0.24, 0.42, 0, deckHeight - 0.28, 0)
    for (const side of [-1, 1]) {
        const wallHeight = deckHeight - 0.17
        plank(model, 0.75, wallHeight, 0.69, side * 1.125, wallHeight / 2 - 0.1, -0.15)
        brace(model, [side * 0.82, 2.35, 0], [side * 0.53, deckHeight - 0.36, 0], 0.14)

        // The leaves swing out against the outer sides of the frame.
        const hingeX = side * 0.75
        const leaf = new Group()
        leaf.position.set(hingeX, 0, 0.245)
        leaf.name = leafName(side)
        model.add(leaf)
        for (const [index, material] of boards.entries()) {
            const height = 2.64 - index * 0.035
            plank(
                leaf,
                0.249,
                height,
                0.09,
                side * (index + 0.5) * 0.25,
                0.14 + height / 2,
                0,
                material,
            )
        }
        for (const y of [0.52, 2.36]) {
            plank(leaf, 0.75, 0.09, 0.06, side * 0.375, y, 0.06, iron)
        }
    }
    poseGateLeaves(model, 1)
    return model
}

const grid: TileCodeGrid = [['🧱', '🛖', '🧱']]
const standingSurfaces: BuildingSurface[] = [
    {
        offset: [-1, 0],
        height: deckHeight,
        links: [1],
        joins: [
            [-2, 0],
            [-1, -1],
            [-1, 1],
        ],
    },
    { offset: [0, 0], height: deckHeight, links: [0, 2] },
    {
        offset: [1, 0],
        height: deckHeight,
        links: [1],
        joins: [
            [2, 0],
            [1, -1],
            [1, 1],
        ],
    },
]
const model = gateModel()
export const cloneGateModel = () => model.clone()
const buildingModel = new BuildingModel(Promise.resolve(model))

export const timberGateBlueprint = {
    buildingModel,
    height: deckHeight,
    standingSurfaces,
    getGrid: () => grid,
    getPlaceholder: () => buildingModel.createModel(),
} satisfies ActorBlueprint & { buildingModel: BuildingModel }
