import { forEachCliffFace } from '+game/world/cliffFaces'
import { type World } from '+game/world/World'

import {
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    LinearSRGBColorSpace,
} from 'three'

export function createCliffGeometry(world: World, tileSize: number) {
    const [width, height] = world.getSize()
    const positions: number[] = []
    const colors: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    const color = new Color()
    const lowerColor = new Color()
    const cornerColor = new Color()

    forEachCliffFace(world, (vertices, _shelf, triangles) => {
        const start = positions.length / 3
        for (const [surfaceX, py, surfaceZ] of vertices) {
            positions.push(surfaceX * tileSize, py * tileSize, surfaceZ * tileSize)
            uvs.push(surfaceX / (width - 1), 1 - surfaceZ / (height - 1))
            const col = Math.floor(surfaceX)
            const tileRow = Math.floor(surfaceZ)
            const u = surfaceX - col
            const v = surfaceZ - tileRow
            const upper = world.tiles[tileRow]!
            const lower = world.tiles[tileRow + 1]!
            color
                .setHex(upper[col]!.color, LinearSRGBColorSpace)
                .lerp(
                    cornerColor.setHex(
                        upper[col + 1]!.color,
                        LinearSRGBColorSpace,
                    ),
                    u,
                )
            lowerColor
                .setHex(lower[col]!.color, LinearSRGBColorSpace)
                .lerp(
                    cornerColor.setHex(
                        lower[col + 1]!.color,
                        LinearSRGBColorSpace,
                    ),
                    u,
                )
            color.lerp(lowerColor, v)
            colors.push(color.r, color.g, color.b)
        }
        for (const index of triangles) indices.push(start + index)
    })

    const geometry = new BufferGeometry()
        .setIndex(indices)
        .setAttribute('position', new Float32BufferAttribute(positions, 3))
        .setAttribute('uv', new Float32BufferAttribute(uvs, 2))
        .setAttribute('color', new Float32BufferAttribute(colors, 3))
    geometry.computeVertexNormals()
    return geometry
}
