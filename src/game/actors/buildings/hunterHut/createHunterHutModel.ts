import {
    BufferGeometry,
    Color,
    CylinderGeometry,
    DoubleSide,
    Float32BufferAttribute,
    Group,
    Mesh,
    MeshStandardMaterial,
    Quaternion,
    Vector3,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

type Point = [number, number, number]

/** Tile-sized, deterministic prototype. Merge by material for building instancing. */
export function createHunterHutModel() {
    const root = new Group()
    root.name = 'Hunter hut'
    const materials = {
        wood: new MeshStandardMaterial({ color: 0x705039, roughness: 1 }),
        cut: new MeshStandardMaterial({ color: 0xb29262, roughness: 1 }),
        earth: new MeshStandardMaterial({
            color: 0x4a3929,
            roughness: 1,
            side: DoubleSide,
        }),
        grass: new MeshStandardMaterial({
            vertexColors: true,
            roughness: 1,
            side: DoubleSide,
            flatShading: true,
        }),
        hide: new MeshStandardMaterial({
            color: 0xc49b68,
            roughness: 1,
            side: DoubleSide,
        }),
    }
    type Surface = keyof typeof materials
    const parts: Record<Surface, BufferGeometry[]> = {
        wood: [],
        cut: [],
        earth: [],
        grass: [],
        hide: [],
    }
    const add = (geometry: BufferGeometry, surface: Surface) => {
        const plain = geometry.index ? geometry.toNonIndexed() : geometry
        plain.deleteAttribute('uv')
        parts[surface].push(plain)
        if (plain !== geometry) geometry.dispose()
    }
    const beam = (a: Point, b: Point, radius: number, surface: Surface = 'wood') => {
        const start = new Vector3(...a),
            end = new Vector3(...b)
        const delta = end.clone().sub(start)
        const geometry = new CylinderGeometry(radius * 0.83, radius, delta.length(), 7)
        geometry.applyQuaternion(
            new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize()),
        )
        geometry.translate(...start.add(end).multiplyScalar(0.5).toArray())
        add(geometry, surface)
    }
    const triangles = (vertices: number[], surface: Surface, colors?: number[]) => {
        const geometry = new BufferGeometry()
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
        if (colors) geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
        geometry.computeVertexNormals()
        add(geometry, surface)
    }
    // A-frame: open porch at +Z, enclosed sleeping space behind it.
    for (const z of [-2.1, -0.8, 0.65, 2]) {
        beam([-2, 0.2, z], [0.18, 3.25, z], 0.12)
        beam([2, 0.2, z], [-0.18, 3.25, z], 0.12)
    }
    beam([0, 3.02, -2.45], [0, 3.02, 2.42], 0.14)
    for (const x of [-1.85, 1.85]) beam([x, 0.2, -2.2], [x, 0.2, 2.25], 0.15)
    beam([-1.28, 1.1, 2.03], [1.28, 1.1, 2.03], 0.09)
    for (let row = 0; row < 13; row++) {
        const y = 0.23 + row * 0.205
        const width = (3 - y) / 1.45
        beam([-width, y, -2.04], [width, y, -2.04], 0.115)
        // Front wall leaves a clearly recessed central doorway.
        if (width > 0.55) {
            beam([-width, y, 0.85], [-0.52, y, 0.85], 0.11)
            beam([0.52, y, 0.85], [width, y, 0.85], 0.11)
        } else beam([-width, y, 0.85], [width, y, 0.85], 0.11)
    }
    for (const x of [-0.54, 0.54]) beam([x, 0.1, 0.9], [x, 2.1, 0.9], 0.1, 'cut')
    beam([-0.64, 2.08, 0.9], [0.64, 2.08, 0.9], 0.11, 'cut')
    for (let i = 0; i < 13; i++)
        beam([-1.7, 0.12, -1.9 + i * 0.3], [1.7, 0.12, -1.9 + i * 0.3], 0.09, 'cut')
    // Connected triangulated turf, with a wavy eave and visible soil thickness.
    const roofPoint = (side: number, u: number, v: number, lower = false): Point => {
        const ripple = Math.sin(u * 19 + v * 13) * 0.045 + Math.sin(v * 27) * 0.025
        return [
            side * u * 2.22,
            3.13 - u * 2.83 + ripple - (lower ? 0.16 : 0),
            -2.3 + v * 4.55,
        ]
    }
    for (const side of [-1, 1]) {
        const vertices: number[] = [],
            colors: number[] = []
        for (let row = 0; row < 10; row++)
            for (let col = 0; col < 14; col++) {
                const a = roofPoint(side, row / 10, col / 14),
                    b = roofPoint(side, (row + 1) / 10, col / 14)
                const c = roofPoint(side, (row + 1) / 10, (col + 1) / 14),
                    d = roofPoint(side, row / 10, (col + 1) / 14)
                vertices.push(...a, ...b, ...d, ...b, ...c, ...d)
                const color = new Color().setHSL(
                    0.22 + 0.018 * Math.sin(col * 3 + row),
                    0.3,
                    0.25 + 0.035 * Math.sin(row * 7 + col * 4),
                )
                for (let i = 0; i < 6; i++) colors.push(color.r, color.g, color.b)
            }
        triangles(vertices, 'grass', colors)
        for (const v of [0, 1])
            for (let i = 0; i < 10; i++) {
                const a = roofPoint(side, i / 10, v),
                    b = roofPoint(side, (i + 1) / 10, v)
                const c = roofPoint(side, (i + 1) / 10, v, true),
                    d = roofPoint(side, i / 10, v, true)
                triangles([...a, ...b, ...d, ...b, ...c, ...d], 'earth')
            }
        for (let i = 0; i < 38; i++) {
            const u = 0.12 + ((i * 17) % 37) / 43,
                v = ((i * 13) % 41) / 41
            const [x, y, z] = roofPoint(side, u, v)
            const color = new Color(0x78834a)
            triangles(
                [x - 0.06, y, z, x + 0.04, y, z, x + side * 0.04, y + 0.16, z + 0.03],
                'grass',
                Array(3).fill(color.toArray()).flat(),
            )
        }
    }
    // Stretched deer hide: shaped outline and bowed center, tied to a timber rack.
    const rackZ = 1.45,
        rackX = 3.05
    for (const x of [rackX - 0.72, rackX + 0.72])
        beam([x, 0.04, rackZ], [x, 2.35, rackZ], 0.065)
    for (const y of [0.4, 2.18])
        beam([rackX - 0.85, y, rackZ], [rackX + 0.85, y, rackZ], 0.065)
    const outline = [
        [-0.2, 0.74],
        [0.2, 0.74],
        [0.28, 0.57],
        [0.58, 0.63],
        [0.49, 0.34],
        [0.36, 0.16],
        [0.39, -0.24],
        [0.58, -0.59],
        [0.31, -0.65],
        [0.16, -0.49],
        [-0.16, -0.49],
        [-0.32, -0.65],
        [-0.58, -0.59],
        [-0.39, -0.24],
        [-0.36, 0.16],
        [-0.49, 0.34],
        [-0.58, 0.63],
        [-0.28, 0.57],
    ]
    outline.forEach(([x, y], i) => {
        const next = outline[(i + 1) % outline.length]!
        const p: Point = [rackX + x!, 1.25 + y!, rackZ + 0.025]
        triangles(
            [
                rackX,
                1.3,
                rackZ + 0.055,
                ...p,
                rackX + next[0]!,
                1.25 + next[1]!,
                rackZ + 0.025,
            ],
            'hide',
        )
        if (i % 2 === 0)
            beam(
                p,
                [rackX + (x! < 0 ? -0.72 : 0.72), 1.25 + y! * 1.1, rackZ],
                0.013,
                'cut',
            )
    })
    // Neatly stacked firewood beneath the side eave.
    for (let row = 0; row < 3; row++)
        for (let col = 0; col < 3 - row; col++) {
            const x = -2.15 + col * 0.22 + row * 0.11,
                y = 0.14 + row * 0.18
            beam([x, y, -1.3], [x, y, -0.35], 0.105)
            beam([x, y, -0.35], [x, y, -0.33], 0.085, 'cut')
        }
    for (const surface of Object.keys(parts) as Surface[]) {
        const geometries = parts[surface]
        const geometry = mergeGeometries(geometries)
        if (geometry) {
            const mesh = new Mesh(geometry, materials[surface])
            mesh.name = surface
            mesh.castShadow = mesh.receiveShadow = true
            root.add(mesh)
        }
        geometries.forEach((geometry) => geometry.dispose())
    }
    return root
}
