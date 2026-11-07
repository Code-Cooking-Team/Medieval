import { TREE_BARK_COLOR } from '+game/const'

import {
    BoxGeometry,
    Color,
    CylinderGeometry,
    Group,
    LinearSRGBColorSpace,
    Mesh,
    MeshStandardMaterial,
} from 'three'

import { ItemId } from './equipment'

type Vector = [number, number, number]

interface EquipmentModel {
    model: Group
    bone: string
    position: Vector
    rotation: Vector
    scale: Vector
}

const wood = new MeshStandardMaterial({ color: 0x65402a })
const steel = new MeshStandardMaterial({
    color: 0xb4bdc6,
    metalness: 0.55,
    roughness: 0.4,
})

function part(material: MeshStandardMaterial, size: Vector, position: Vector) {
    const mesh = new Mesh(new BoxGeometry(...size), material)
    mesh.position.set(...position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
}

const sword = new Group()
sword.add(
    part(wood, [3, 15, 3], [0, 0, 0]),
    part(steel, [13, 2, 4], [0, 8, 0]),
    part(steel, [6, 44, 2], [0, 31, 0]),
)
const tip = part(steel, [4.25, 4.25, 2], [0, 53, 0])
tip.rotation.z = Math.PI / 4
sword.add(tip)

const hatchet = new Group()
// The hand sits near the butt of the handle, with the blade at the far end.
hatchet.add(
    part(wood, [4, 76, 4], [0, 27, 0]),
    part(steel, [20, 12, 5], [-7, 56, 0]),
    part(steel, [8, 20, 4], [-17, 56, 0]),
)

const hammer = new Group()
hammer.add(part(wood, [4, 48, 4], [0, 16, 0]), part(steel, [24, 12, 10], [0, 36, 0]))

const grip = {
    bone: 'mixamorig:RightHand',
    position: [-8, 2, 0] as Vector,
    rotation: [Math.PI / 2, 0, 0] as Vector,
    scale: [1, 1, 1] as Vector,
}

export const equipmentModels: Partial<Record<ItemId, EquipmentModel>> = {
    sword: { ...grip, model: sword },
    hatchet: { ...grip, model: hatchet },
    hammer: { ...grip, model: hammer },
}

const log = new Group()
const bark = new MeshStandardMaterial({
    color: new Color().setHex(TREE_BARK_COLOR, LinearSRGBColorSpace),
    metalness: 0.8,
    roughness: 1,
    flatShading: true,
})
const endGrain = new MeshStandardMaterial({ color: 0xb2a08b })
const trunk = new Mesh(new CylinderGeometry(11, 13, 124, 6), [bark, endGrain, endGrain])
trunk.castShadow = true
trunk.receiveShadow = true
log.add(trunk)

export const carriedLogModel: EquipmentModel = {
    ...grip,
    model: log,
    position: [-9, 0, 5],
}
