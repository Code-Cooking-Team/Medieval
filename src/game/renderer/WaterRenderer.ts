import { config } from '+config'
import type { ClockInfo } from '+game/types'
import { isWaterfall } from '+game/world/water'
import type { WaterRegion } from '+game/world/water'
import type { World } from '+game/world/World'

import {
    BufferGeometry,
    DoubleSide,
    Float32BufferAttribute,
    Mesh,
    MeshStandardMaterial,
} from 'three'

import { BasicRenderer } from './lib/BasicRenderer'

const RIVER_DIVISIONS = 6
const MAX_WAVE_HEIGHT = 0.22

export class WaterRenderer extends BasicRenderer {
    private readonly surfaces: { geometry: BufferGeometry; base: Float32Array }[] = []
    private readonly materials = [
        new MeshStandardMaterial({
            color: 0xa2d3e8,
            side: DoubleSide,
            roughness: 0.15,
            metalness: 0.575,
            flatShading: true,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
        }),
        new MeshStandardMaterial({
            color: 0xa3deed,
            emissive: 0x71bfd8,
            emissiveIntensity: 0.45,
            side: DoubleSide,
            roughness: 0.38,
            flatShading: true,
        }),
    ]

    constructor(world: World) {
        super()
        const size = world.getSize()
        for (const region of world.waterRegions) {
            const geometry = createSurface(region, size)
            const base = geometry.getAttribute('position').array.slice() as Float32Array
            this.surfaces.push({ geometry, base })
            this.group.add(new Mesh(geometry, this.materials))
        }
    }

    public render({ elapsedTime }: ClockInfo) {
        const scale = config.renderer.tileSize
        for (const { geometry, base } of this.surfaces) {
            const position = geometry.getAttribute('position')
            for (let vertex = 0; vertex < position.count; vertex++) {
                const x = base[vertex * 3]! / scale
                const z = base[vertex * 3 + 2]! / scale
                const wave =
                    0.12 * Math.sin(x * 1.6 + z * 0.9 - elapsedTime * 1.25) +
                    0.1 * Math.sin(z * 2.1 - x * 0.7 - elapsedTime * 0.125)
                position.setY(vertex, base[vertex * 3 + 1]! + wave * scale)
            }
            position.needsUpdate = true
        }
    }

    public destroy() {
        for (const { geometry } of this.surfaces) geometry.dispose()
        for (const material of this.materials) material.dispose()
    }
}

function createSurface(region: WaterRegion, [width, height]: [number, number]) {
    const geometry = new BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []

    if (region.kind === 'river') {
        const stride = RIVER_DIVISIONS + 1
        for (const {
            center: [x, z],
            halfWidth,
            elevation,
        } of region.sections) {
            for (let column = 0; column < stride; column++) {
                const across = (2 * column) / RIVER_DIVISIONS - 1
                vertices.push(x + across * halfWidth, elevation, z)
            }
        }
        for (let row = 1; row < region.sections.length; row++) {
            const material = Number(
                isWaterfall(region.sections[row - 1]!, region.sections[row]!),
            )
            const previousGroup = geometry.groups.at(-1)
            if (previousGroup?.materialIndex === material) {
                previousGroup.count += RIVER_DIVISIONS * 6
            } else {
                geometry.addGroup(indices.length, RIVER_DIVISIONS * 6, material)
            }
            for (let column = 0; column < RIVER_DIVISIONS; column++) {
                const a = (row - 1) * stride + column
                const b = a + stride
                indices.push(a, b, a + 1, a + 1, b, b + 1)
            }
        }
    } else {
        const corners = new Map<string, number>()
        const corner = (x: number, z: number) => {
            x = Math.max(0, Math.min(width - 1, x))
            z = Math.max(0, Math.min(height - 1, z))
            const key = x + ',' + z
            const existing = corners.get(key)
            if (existing !== undefined) return existing
            const index = vertices.length / 3
            vertices.push(x, region.elevation, z)
            corners.set(key, index)
            return index
        }
        for (const [x, z] of region.tiles) {
            const a = corner(x - 0.5, z - 0.5)
            const b = corner(x - 0.5, z + 0.5)
            const c = corner(x + 0.5, z - 0.5)
            const d = corner(x + 0.5, z + 0.5)
            indices.push(a, b, c, c, b, d)
        }
        geometry.addGroup(0, indices.length, 0)
    }

    const scale = config.renderer.tileSize
    geometry.setAttribute(
        'position',
        new Float32BufferAttribute(
            vertices.map((value) => value * scale),
            3,
        ),
    )
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    geometry.computeBoundingSphere()
    geometry.boundingSphere!.radius += MAX_WAVE_HEIGHT * scale
    return geometry
}
