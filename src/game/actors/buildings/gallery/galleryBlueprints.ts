import { type BuildingSurface } from '+game/core/buildingSurfaces'
import { TIMBER_GALLERY_HEIGHT as deckHeight } from '+game/core/StandingSurfaces'
import { BuildingModel } from '+game/renderer/lib/BuildingModel'
import { type ActorBlueprint } from '+game/types'
import { type TileCodeGrid } from '+game/world/tileCodes'

import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'

const stairLength = 4
const stairCenter = -0.5
const stairRisePerTile = deckHeight / stairLength

const timber = new MeshStandardMaterial({ color: 0x68472d })
const boards = new MeshStandardMaterial({ color: 0x9a7249 })

function plank(
    model: Group,
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    material = timber,
) {
    const mesh = new Mesh(new BoxGeometry(width, height, depth), material)
    mesh.position.set(x, y, z)
    mesh.castShadow = mesh.receiveShadow = true
    model.add(mesh)
    return mesh
}

function galleryModel() {
    const model = new Group()
    for (let board = 0; board < 4; board++) {
        plank(model, 1, 0.12, 0.25, 0, deckHeight - 0.06, -0.375 + board / 4, boards)
    }
    for (const x of [-0.37, 0.37]) {
        plank(model, 0.13, 0.17, 1, x, deckHeight - 0.19, 0)
        for (const z of [-0.35, 0.35])
            plank(model, 0.12, deckHeight, 0.12, x, deckHeight / 2 - 0.09, z)
        plank(model, 0.09, 0.09, 0.76, x, deckHeight - 0.36, 0).rotation.x =
            Math.sign(x) * 0.32
    }
    for (const z of [-0.35, 0.35]) {
        plank(model, 0.78, 0.09, 0.09, 0, deckHeight - 0.36, z).rotation.z =
            Math.sign(z) * 0.32
    }
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
        plank(model, 0.94, 0.13, treadDepth, 0, height - 0.065, z, boards)
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
