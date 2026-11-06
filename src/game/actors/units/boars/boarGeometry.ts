import {
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    Uint16BufferAttribute,
    Vector3,
} from 'three'

type Quad = [number, number, number, number]

// Cross sections run from rump to snout along the walkable renderer's +Z axis.
// Each section has two attachment strips separated by a central strip.
const sections = [
    { z: -0.68, width: 0.22, bottom: 0.4, top: 0.67 },
    { z: -0.53, width: 0.29, bottom: 0.32, top: 0.74 },
    { z: -0.32, width: 0.31, bottom: 0.32, top: 0.77 },
    { z: 0.02, width: 0.34, bottom: 0.31, top: 0.83 },
    { z: 0.24, width: 0.32, bottom: 0.31, top: 0.84 },
    { z: 0.43, width: 0.25, bottom: 0.31, top: 0.74 },
    { z: 0.6, width: 0.15, bottom: 0.33, top: 0.54 },
    { z: 0.74, width: 0.12, bottom: 0.35, top: 0.49 },
]

export function createBoarGeometry() {
    const positions: Vector3[] = []
    const colors: number[] = []
    const indices: number[] = []
    const skinIndices: number[] = []
    const skinWeights: number[] = []
    const legPivots: Vector3[] = []
    const fur = new Color(0x563522)
    const darkFur = new Color(0x35231a)
    const snout = new Color(0x795245)
    const ivory = new Color(0xe0cda7)

    const vertex = (position: Vector3, color: Color, bone = 0) => {
        skinIndices.push(bone, 0, 0, 0)
        skinWeights.push(1, 0, 0, 0)
        colors.push(color.r, color.g, color.b)
        return positions.push(position) - 1
    }

    const quad = ([a, b, c, d]: Quad) => indices.push(a, b, c, a, c, d)
    const extrude = (face: Quad, tip: Vector3, color: Color) => {
        const tipIndex = vertex(tip, color)
        for (const [i, corner] of face.entries()) {
            indices.push(corner, face[(i + 1) % 4]!, tipIndex)
        }
    }

    const rings = sections.map(({ z, width, bottom, top }, index) => {
        const offsets = [-1, -0.34, 0.34, 1]
        const color = index === sections.length - 1 ? snout : fur
        return [
            ...offsets.map((x) => vertex(new Vector3(x * width, bottom, z), color)),
            ...offsets.reverse().map((x) => {
                const onRidge = Math.abs(x) < 1 && index >= 1 && index <= 4
                return vertex(
                    new Vector3(x * width, top + (onRidge ? 0.08 : 0), z),
                    onRidge ? darkFur : color,
                )
            }),
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
                // Keep the shared hip vertices on the body and bind the hoof to its leg.
                const bone = legPivots.push(center)
                const foot = face.map((corner) => {
                    const point = positions[corner]!.clone().lerp(center, 0.42)
                    point.y = 0
                    return vertex(point, darkFur, bone)
                }) as Quad
                for (let i = 0; i < 4; i++) {
                    const j = (i + 1) % 4
                    quad([face[i]!, face[j]!, foot[j]!, foot[i]!])
                }
                quad(foot)
            } else if (band === 4 && (edge === 4 || edge === 6)) {
                const side = edge === 4 ? 1 : -1
                extrude(face, new Vector3(side * 0.23, 1.01, 0.28), darkFur)
            } else if (band === 6 && (edge === 3 || edge === 7)) {
                const side = edge === 3 ? 1 : -1
                extrude(face, new Vector3(side * 0.21, 0.56, 0.68), ivory)
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
