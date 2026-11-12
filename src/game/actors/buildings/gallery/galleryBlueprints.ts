import { type BuildingSurface } from '+game/core/buildingSurfaces'
import { TIMBER_GALLERY_HEIGHT as deckHeight } from '+game/core/StandingSurfaces'
import { BuildingModel } from '+game/renderer/lib/BuildingModel'
import { type ActorBlueprint } from '+game/types'
import { type TileCodeGrid } from '+game/world/tileCodes'

import { Group } from 'three'

import { boards, brace, plank, timberDeck } from '../timberModel'

const stairLength = 4
const stairCenter = -0.5
const stairRisePerTile = deckHeight / stairLength

function galleryModel() {
    const model = new Group()
    timberDeck(model, 1, deckHeight)
    for (const x of [-0.35, 0.35]) {
        plank(model, 0.18, deckHeight - 0.26, 0.2, x, (deckHeight - 0.38) / 2, 0)
    }
    plank(model, 1, 0.21, 0.23, 0, deckHeight - 0.265, 0)
    brace(model, [-0.35, deckHeight - 1.08, 0], [0.35, deckHeight - 0.35, 0], 0.11)
    return model
}

function stairModel() {
    const model = new Group()
    const stepCount = 12
    const treadDepth = stairLength / stepCount
    const bottom = stairCenter + stairLength / 2
    for (let step = 0; step < stepCount; step++) {
        const z = bottom - (step + 0.5) * treadDepth
        const height = ((step + 1) * deckHeight) / stepCount
        plank(
            model,
            0.94,
            0.13,
            treadDepth - 0.006,
            0,
            height - 0.065,
            z,
            boards[step % boards.length],
        )
    }
    const slope = Math.atan2(deckHeight, stairLength)
    for (const x of [-0.36, 0.36]) {
        plank(
            model,
            0.14,
            0.19,
            Math.hypot(stairLength, deckHeight),
            x,
            deckHeight / 2 + 0.02,
            stairCenter,
        ).rotation.x = slope
        for (const z of [-2.34, stairCenter, 1.34]) {
            const height = (bottom - z) * stairRisePerTile
            plank(model, 0.14, height, 0.14, x, height / 2 - 0.08, z)
        }
    }
    return model
}

function blueprint(
    model: Group,
    grid: TileCodeGrid,
    standingSurfaces: BuildingSurface[],
) {
    const buildingModel = new BuildingModel(Promise.resolve(model))
    return {
        buildingModel,
        standingSurfaces,
        height: deckHeight,
        getGrid: () => grid,
        getPlaceholder: () => buildingModel.createModel(),
    } satisfies ActorBlueprint & { buildingModel: BuildingModel }
}

export const galleryBlueprint = blueprint(
    galleryModel(),
    [['🛖']],
    [
        {
            offset: [0, 0],
            height: deckHeight,
            links: [],
            joins: [
                [0, -1],
                [0, 1],
                [-1, 0],
                [1, 0],
            ],
        },
    ],
)

export const galleryStairsBlueprint = blueprint(
    stairModel(),
    [['🛖'], ['🧱'], ['🧱'], ['🧱']],
    [
        { offset: [0, 1], height: stairRisePerTile, links: [1], exits: [[0, 2]] },
        { offset: [0, 0], height: 2 * stairRisePerTile, links: [0, 2] },
        { offset: [0, -1], height: 3 * stairRisePerTile, links: [1, 3] },
        {
            offset: [0, -2],
            height: deckHeight,
            links: [2],
            joins: [
                [0, -3],
                [-1, -2],
                [1, -2],
            ],
        },
    ],
)
