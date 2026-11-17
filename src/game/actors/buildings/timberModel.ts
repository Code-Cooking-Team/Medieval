import { BoxGeometry, type Group, Mesh, MeshStandardMaterial, Vector3 } from 'three'

const timber = new MeshStandardMaterial({ color: 0x594232, roughness: 0.84 })
export const boards = [0x634a37, 0x5d4534, 0x664d39].map(
    (color) => new MeshStandardMaterial({ color, roughness: 0.88 }),
)
export const iron = new MeshStandardMaterial({
    color: 0x343130,
    roughness: 0.75,
    metalness: 0.35,
})

export function plank(
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

export function timberDeck(model: Group, width: number, height: number) {
    const boardDepth = 1 / boards.length
    for (const [index, material] of boards.entries()) {
        const z = -0.5 + (index + 0.5) * boardDepth
        plank(model, width, 0.16, boardDepth - 0.005, 0, height - 0.08, z, material)
    }
}

export function brace(
    model: Group,
    from: [number, number, number],
    to: [number, number, number],
    thickness: number,
) {
    const start = new Vector3(...from)
    const direction = new Vector3(...to).sub(start)
    const center = start.addScaledVector(direction, 0.5)
    const beam = plank(
        model,
        thickness,
        direction.length(),
        thickness,
        center.x,
        center.y,
        center.z,
    )
    beam.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize())
    return beam
}
