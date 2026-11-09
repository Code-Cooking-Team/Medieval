import { config } from '+config'
import type { ClockInfo } from '+game/types'
import { expandWaterFootprint, isWaterfall, SHORE_OVERLAP } from '+game/world/water'
import type { RiverSection, WaterRegion } from '+game/world/water'
import type { World } from '+game/world/World'

import {
    BufferGeometry,
    DoubleSide,
    Float32BufferAttribute,
    Mesh,
    MeshStandardMaterial,
} from 'three'

import { BasicRenderer } from './lib/BasicRenderer'

const RIVER_VERTEX_SPACING = 0.8
const MAX_WAVE_HEIGHT = 0.22

export class WaterRenderer extends BasicRenderer {
    private readonly surfaces: {
        geometry: BufferGeometry
        base: Float32Array
        falling: Uint8Array
    }[] = []
    private readonly material = new MeshStandardMaterial({
        color: 0xa2d3e8,
        side: DoubleSide,
        roughness: 0.24,
        metalness: 0.575,
        flatShading: true,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
    })
    private readonly materials = [this.material, this.material]

    constructor(world: World) {
        super()
        const size = world.getSize()
        for (const region of world.waterRegions) {
            const { geometry, falling } = createSurface(region, size)
            const base = geometry.getAttribute('position').array.slice() as Float32Array
            this.surfaces.push({ geometry, base, falling })
            this.group.add(new Mesh(geometry, this.materials))
        }
    }

    public render({ elapsedTime }: ClockInfo) {
        const scale = config.renderer.tileSize
        for (const { geometry, base, falling } of this.surfaces) {
            const position = geometry.getAttribute('position')
            for (let vertex = 0; vertex < position.count; vertex++) {
                const x = base[vertex * 3]! / scale
                const z = base[vertex * 3 + 2]! / scale
                // Crossing ripples use world coordinates, including across ribbon joins.
                const wave =
                    0.075 *
                        Math.sin(
                            1.8 * x +
                                0.6 * z +
                                0.7 * Math.sin(1.1 * z) -
                                elapsedTime * 2.1,
                        ) +
                    0.062 *
                        Math.sin(
                            1.75 * z -
                                0.52 * x +
                                0.65 * Math.sin(1.2 * x) -
                                elapsedTime * 1.65,
                        ) +
                    0.031 * Math.sin(1.55 * x - 1.7 * z + elapsedTime * 1.4)
                const vertical = base[vertex * 3 + 1]! / scale
                const fallWarp = falling[vertex]!
                    ? 0.16 *
                      Math.sin(vertical * 1.45 + elapsedTime * 4.2 + x * 0.8) *
                      Math.sin(vertical * 0.72 + elapsedTime * 2.7 + z * 1.1)
                    : 0
                position.setX(vertex, base[vertex * 3]! + fallWarp * scale)
                position.setY(
                    vertex,
                    base[vertex * 3 + 1]! + (wave + fallWarp * 0.65) * scale,
                )
                position.setZ(vertex, base[vertex * 3 + 2]! - fallWarp * scale)
            }
            position.needsUpdate = true
            geometry.computeVertexNormals()
        }
    }

    public destroy() {
        for (const { geometry } of this.surfaces) geometry.dispose()
        this.material.dispose()
    }
}

function createSurface(region: WaterRegion, [width, height]: [number, number]) {
    const geometry = new BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const fallingVertices: number[] = []

    if (region.kind === 'river') {
        const widest = Math.max(
            0,
            ...[region.sections, ...(region.tributaries ?? [])].flatMap((sections) =>
                sections.map(({ halfWidth }) => halfWidth),
            ),
        )
        const divisions = Math.ceil((2 * (widest + SHORE_OVERLAP)) / RIVER_VERTEX_SPACING)
        const stride = divisions + 1
        const along = region.axis === 'x' ? 0 : 1
        const cross = along === 0 ? 1 : 0
        const crossLimit = (along === 0 ? height : width) - 1
        const appendRibbon = (
            sections: RiverSection[],
            parent?: Map<number, RiverSection>,
        ) => {
            const start = vertices.length / 3
            const first = sections[0]!
            const parentStart = parent?.get(first.center[along])
            const side =
                parentStart && first.center[cross] < parentStart.center[cross] ? -1 : 1
            for (const section of sections) {
                const width = section.halfWidth + SHORE_OVERLAP
                const center = section.center[cross]
                let left = center - width
                let right = center + width
                const main = parent?.get(section.center[along])
                if (main) {
                    const seam =
                        main.center[cross] + side * (main.halfWidth + SHORE_OVERLAP)
                    // Trim the branch at the main ribbon so transparent surfaces don't overlap.
                    if (side < 0) {
                        left = Math.min(left, seam)
                        right = Math.min(right, seam)
                    } else {
                        left = Math.max(left, seam)
                        right = Math.max(right, seam)
                    }
                }
                for (let column = 0; column < stride; column++) {
                    const lateral = Math.max(
                        0,
                        Math.min(
                            crossLimit,
                            left + ((right - left) * column) / divisions,
                        ),
                    )
                    vertices.push(
                        along === 0 ? section.center[0] : lateral,
                        section.elevation,
                        along === 0 ? lateral : section.center[1],
                    )
                }
            }
            for (let row = 1; row < sections.length; row++) {
                const isFall = isWaterfall(sections[row - 1]!, sections[row]!)
                if (isFall) {
                    for (let column = 0; column < stride; column++) {
                        fallingVertices[start + (row - 1) * stride + column] = 1
                        fallingVertices[start + row * stride + column] = 1
                    }
                }
                const previousGroup = geometry.groups.at(-1)
                if (previousGroup?.materialIndex === Number(isFall)) {
                    previousGroup.count += divisions * 6
                } else {
                    geometry.addGroup(indices.length, divisions * 6, Number(isFall))
                }
                for (let column = 0; column < divisions; column++) {
                    const a = start + (row - 1) * stride + column
                    const b = a + stride
                    if ((row + column) % 2 === 0) {
                        indices.push(a, b, a + 1, a + 1, b, b + 1)
                    } else {
                        indices.push(a, b, b + 1, a, b + 1, a + 1)
                    }
                }
            }
        }
        appendRibbon(region.sections)
        if (region.tributaries?.length) {
            const main = new Map(
                region.sections.map((section) => [section.center[along], section]),
            )
            for (const tributary of region.tributaries) appendRibbon(tributary, main)
        }
    } else if (region.kind === 'drainage') {
        const sampleIndices = new Map<number, number>()
        const falling = new Uint8Array(region.samples.length)
        const falls: number[] = []
        for (const [i, [x, y, elevation, isFalling]] of region.samples.entries()) {
            sampleIndices.set(y * width + x, i)
            if (isFalling) falling[i] = 1
            vertices.push(x, elevation, y)
        }
        const triangle = (a: number, b: number | undefined, c: number | undefined) => {
            if (b === undefined || c === undefined) return
            const ya = vertices[3 * a + 1]!
            const yb = vertices[3 * b + 1]!
            const yc = vertices[3 * c + 1]!
            const steep = Math.max(ya, yb, yc) - Math.min(ya, yb, yc) > 0.45
            const triangles =
                steep && falling[a] && falling[b] && falling[c] ? falls : indices
            if (triangles === falls) {
                fallingVertices[a] = fallingVertices[b!] = fallingVertices[c!] = 1
            }
            triangles.push(a, b, c)
        }
        for (const [cell, a] of sampleIndices) {
            const x = cell % width
            if (x === width - 1) continue
            const b = sampleIndices.get(cell + width)
            const c = sampleIndices.get(cell + 1)
            const d = sampleIndices.get(cell + width + 1)
            const y = Math.floor(cell / width)
            const flip =
                ((Math.imul(x, 0x1f123bb5) ^ Math.imul(y, 0x5f356495)) >>> 12) & 1
            if (d !== undefined && flip) {
                triangle(a, b, d)
                triangle(a, d, c)
            } else {
                triangle(a, b, c)
                if (c !== undefined) triangle(c, b, d)
            }
        }
        if (indices.length) geometry.addGroup(0, indices.length, 0)
        if (falls.length) {
            geometry.addGroup(indices.length, falls.length, 1)
            for (const index of falls) indices.push(index)
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
        for (const cell of expandWaterFootprint(
            region.tiles,
            width,
            height,
            SHORE_OVERLAP,
        )) {
            const x = cell % width
            const z = Math.floor(cell / width)
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
    const vertexFalling = new Uint8Array(vertices.length / 3)
    for (let vertex = 0; vertex < fallingVertices.length; vertex++) {
        if (fallingVertices[vertex]) vertexFalling[vertex] = 1
    }
    return { geometry, falling: vertexFalling }
}
