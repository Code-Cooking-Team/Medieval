import {
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    Uint16BufferAttribute,
    Vector3,
} from 'three'

type Quad = [number, number, number, number]

const coat = new Color(0xa56838)
const cream = new Color(0xe4cba0)
const dark = new Color(0x362720)
const ear = new Color(0xb88569)
const antler = new Color(0xc6aa7d)

// Cross sections from rump to muzzle, facing +Z.
const sections = [
    { z: -0.62, width: 0.16, bottom: 0.61, top: 0.93 },
    { z: -0.49, width: 0.19, bottom: 0.62, top: 0.99 },
    { z: -0.27, width: 0.17, bottom: 0.64, top: 0.96 },
    { z: 0.02, width: 0.16, bottom: 0.64, top: 0.94 },
    { z: 0.22, width: 0.18, bottom: 0.62, top: 1.02 },
    { z: 0.34, width: 0.1, bottom: 0.89, top: 1.29 },
    { z: 0.46, width: 0.105, bottom: 1.15, top: 1.46 },
    { z: 0.6, width: 0.105, bottom: 1.2, top: 1.43 },
    { z: 0.8, width: 0.065, bottom: 1.21, top: 1.31 },
]

export function createDeerGeometry() {
    const positions: Vector3[] = []
    const colors: number[] = []
    const indices: number[] = []
    const skinIndices: number[] = []
    const skinWeights: number[] = []
    const legPivots: Vector3[] = []

    const vertex = (position: Vector3, color: Color, bone = 0, weight = 1) => {
        skinIndices.push(bone, 0, 0, 0)
        skinWeights.push(weight, 1 - weight, 0, 0)
        colors.push(color.r, color.g, color.b)
        return positions.push(position) - 1
    }

    const quad = ([a, b, c, d]: Quad) => indices.push(a, b, c, a, c, d)
    const join = (base: Quad, end: Quad) => {
        for (let i = 0; i < 4; i++) {
            const next = (i + 1) % 4
            quad([base[i]!, base[next]!, end[next]!, end[i]!])
        }
    }

    const pointFace = (face: Quad, tip: Vector3, color: Color) => {
        const tipIndex = vertex(tip, color, 1)
        for (let i = 0; i < 4; i++) {
            indices.push(face[i]!, face[(i + 1) % 4]!, tipIndex)
        }
    }

    const rings = sections.map(({ z, width, bottom, top }, index) => {
        const offsets = [-1, -0.35, 0.35, 1]
        // Blend the middle of the neck into the chest. The head and antlers move together.
        const neckWeight = index < 5 ? 0 : index === 5 ? 0.55 : 1
        return [
            ...offsets.map((x) =>
                vertex(
                    new Vector3(x * width, bottom, z),
                    index === sections.length - 1 ? dark : cream,
                    1,
                    neckWeight,
                ),
            ),
            ...offsets
                .reverse()
                .map((x) =>
                    vertex(
                        new Vector3(x * width, top - Math.abs(x) * 0.045, z),
                        index === sections.length - 1 ? dark : coat,
                        1,
                        neckWeight,
                    ),
                ),
        ]
    })

    for (let band = 0; band < rings.length - 1; band++) {
        const back = rings[band]!
        const front = rings[band + 1]!
        for (let edge = 0; edge < back.length; edge++) {
            const next = (edge + 1) % back.length
            const face: Quad = [back[edge]!, back[next]!, front[next]!, front[edge]!]

            if ((band === 1 || band === 3) && (edge === 0 || edge === 2)) {
                const center = new Vector3()
                for (const corner of face) center.add(positions[corner]!)
                center.multiplyScalar(0.25)

                const legBone = 1 + legPivots.push(center)
                const knee = face.map((corner) => {
                    const point = positions[corner]!.clone().lerp(center, 0.57)
                    point.y = 0.29
                    point.z += band === 1 ? -0.075 : 0.015
                    return vertex(point, coat, legBone)
                }) as Quad
                const hoof = face.map((corner) => {
                    const point = positions[corner]!.clone().lerp(center, 0.67)
                    point.y = 0
                    point.z += band === 1 ? -0.01 : 0.025
                    return vertex(point, dark, legBone)
                }) as Quad
                join(face, knee)
                join(knee, hoof)
                quad(hoof)
            } else if (band === 6 && (edge === 3 || edge === 7)) {
                const side = edge === 3 ? 1 : -1
                pointFace(face, new Vector3(side * 0.29, 1.46, 0.36), ear)
            } else if (band === 6 && (edge === 4 || edge === 6)) {
                const side = edge === 4 ? 1 : -1
                const center = new Vector3()
                for (const corner of face) center.add(positions[corner]!)
                center.multiplyScalar(0.25)

                const fork = face.map((corner) => {
                    const point = positions[corner]!.clone().lerp(center, 0.72)
                    point.add(new Vector3(side * 0.075, 0.24, -0.055))
                    return vertex(point, antler, 1)
                }) as Quad

                for (let i = 0; i < 4; i++) {
                    const j = (i + 1) % 4
                    const faceSide: Quad = [face[i]!, face[j]!, fork[j]!, fork[i]!]
                    if (i === 2) {
                        pointFace(faceSide, new Vector3(side * 0.12, 1.78, 0.66), antler)
                    } else {
                        quad(faceSide)
                    }
                }
                pointFace(fork, new Vector3(side * 0.21, 1.88, 0.34), antler)
            } else {
                quad(face)
            }
        }
    }

    const rump = rings[0]!
    const nose = rings[rings.length - 1]!
    for (let strip = 0; strip < 3; strip++) {
        quad([rump[strip + 1]!, rump[strip]!, rump[7 - strip]!, rump[6 - strip]!])
        quad([nose[strip]!, nose[strip + 1]!, nose[6 - strip]!, nose[7 - strip]!])
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute(
        'position',
        new Float32BufferAttribute(
            positions.flatMap((position) => position.toArray()),
            3,
        ),
    )
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    geometry.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndices, 4))
    geometry.setAttribute('skinWeight', new Float32BufferAttribute(skinWeights, 4))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return { geometry, legPivots }
}
