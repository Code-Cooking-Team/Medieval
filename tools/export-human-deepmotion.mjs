import { readFileSync, writeFileSync } from 'node:fs'
import { Matrix4, Vector3, Quaternion } from 'three'

// Restore the actual bind pose, rather than exporting the animated node pose.
const source = new URL('../src/game/actors/units/human/models/human.gltf', import.meta.url)
const output = new URL('../src/game/actors/units/human/models/human-deepmotion.glb', import.meta.url)
const gltf = JSON.parse(readFileSync(source, 'utf8'))
const offsets = []
let length = 0
const chunks = gltf.buffers.map(buffer => {
    if (!buffer.uri.startsWith('data:')) throw new Error('Expected embedded buffer')
    offsets.push(length)
    const data = Buffer.from(buffer.uri.split(',')[1], 'base64')
    const padded = Buffer.alloc(Math.ceil(data.length / 4) * 4)
    data.copy(padded)
    length += padded.length
    return padded
})
const binary = Buffer.concat(chunks)
for (const view of gltf.bufferViews) {
    view.byteOffset = (view.byteOffset ?? 0) + offsets[view.buffer]
    view.buffer = 0
}
gltf.buffers = [{ byteLength: binary.length }]
const parents = new Map()
gltf.nodes.forEach((node, parent) => node.children?.forEach(child => parents.set(child, parent)))
const local = node => node.matrix
    ? new Matrix4().fromArray(node.matrix)
    : new Matrix4().compose(new Vector3().fromArray(node.translation ?? [0, 0, 0]), new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]), new Vector3().fromArray(node.scale ?? [1, 1, 1]))
const world = index => parents.has(index)
    ? world(parents.get(index)).multiply(local(gltf.nodes[index]))
    : local(gltf.nodes[index])
// Geometry and inverse bind matrices are already expressed in metres, Y-up.
// The source carries a Blender armature wrapper; remove it for this clean export.
for (const root of gltf.scenes[gltf.scene ?? 0].nodes) {
    Object.assign(gltf.nodes[root], { translation: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] })
    delete gltf.nodes[root].matrix
}
const bindWorld = new Map()
for (const [skinIndex, skin] of gltf.skins.entries()) {
    const meshIndex = gltf.nodes.findIndex(node => node.skin === skinIndex)
    const meshWorld = world(meshIndex)
    const accessor = gltf.accessors[skin.inverseBindMatrices]
    const view = gltf.bufferViews[accessor.bufferView]
    if (accessor.componentType !== 5126 || accessor.type !== 'MAT4') throw new Error('Expected float matrices')
    skin.joints.forEach((joint, i) => {
        const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0) + i * (view.byteStride ?? 64)
        const values = Array.from({ length: 16 }, (_, j) => binary.readFloatLE(offset + j * 4))
        bindWorld.set(joint, meshWorld.clone().multiply(new Matrix4().fromArray(values).invert()))
    })
    skin.skeleton = skin.joints.find(joint => !skin.joints.includes(parents.get(joint)))
}
for (const [joint, matrix] of bindWorld) {
    const parent = parents.get(joint)
    const parentWorld = bindWorld.get(parent) ?? (parent === undefined ? new Matrix4() : world(parent))
    const transform = parentWorld.clone().invert().multiply(matrix)
    const translation = new Vector3(), rotation = new Quaternion(), scale = new Vector3()
    transform.decompose(translation, rotation, scale)
    Object.assign(gltf.nodes[joint], { translation: translation.toArray(), rotation: rotation.toArray(), scale: scale.toArray() })
    delete gltf.nodes[joint].matrix
}
for (const name of ['Hips', 'Head', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand', 'LeftFoot', 'RightFoot']) {
    const index = gltf.nodes.findIndex(node => node.name === `mixamorig:${name}`)
    console.log(name, new Vector3().setFromMatrixPosition(world(index)).toArray().map(n => +n.toFixed(4)))
}
// Promote the mesh and skeleton to scene roots (the wrapper is identity now).
const scene = gltf.scenes[gltf.scene ?? 0]
scene.nodes = scene.nodes.flatMap(index => gltf.nodes[index].mesh === undefined && !gltf.skins.some(skin => skin.joints.includes(index)) ? gltf.nodes[index].children ?? [index] : [index])
if (gltf.nodes.at(-1).name === 'player' && !scene.nodes.includes(gltf.nodes.length - 1)) gltf.nodes.pop()
for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) {
    for (const index of Object.values(primitive.attributes)) gltf.bufferViews[gltf.accessors[index].bufferView].target = 34962
    if (primitive.indices !== undefined) gltf.bufferViews[gltf.accessors[primitive.indices].bufferView].target = 34963
}
delete gltf.animations
const json = Buffer.from(JSON.stringify(gltf))
const jsonChunk = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20)
json.copy(jsonChunk)
const binChunk = Buffer.alloc(Math.ceil(binary.length / 4) * 4)
binary.copy(binChunk)
const header = Buffer.alloc(12), jsonHeader = Buffer.alloc(8), binHeader = Buffer.alloc(8)
header.writeUInt32LE(0x46546c67); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + jsonChunk.length + binChunk.length, 8)
jsonHeader.writeUInt32LE(jsonChunk.length); jsonHeader.writeUInt32LE(0x4e4f534a, 4)
binHeader.writeUInt32LE(binChunk.length); binHeader.writeUInt32LE(0x004e4942, 4)
writeFileSync(output, Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]))
console.log(`Exported ${output.pathname}`)
