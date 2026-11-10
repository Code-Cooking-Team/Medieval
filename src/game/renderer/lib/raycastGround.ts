import { Box3, type BufferGeometry, type Ray, Vector3 } from 'three'

// The ground's index buffer lists each cell's triangles together in row-major order.
export function raycastGround(
    ray: Ray,
    geometry: BufferGeometry,
    columns: number,
    rows: number,
    tileSize: number,
    maxDistance: number,
) {
    const index = geometry.getIndex()
    if (!index || columns < 1 || rows < 1) return
    const positions = geometry.getAttribute('position')
    const indicesPerCell = index.count / (columns * rows)
    const bounds = new Box3(
        new Vector3(0, -Infinity, 0),
        new Vector3(columns * tileSize, Infinity, rows * tileSize),
    )
    const entry = ray.origin.clone()
    if (!bounds.containsPoint(entry) && !ray.intersectBox(bounds, entry)) return
    if (entry.distanceTo(ray.origin) > maxDistance) return

    let x = Math.min(columns - 1, Math.max(0, Math.floor(entry.x / tileSize)))
    let z = Math.min(rows - 1, Math.max(0, Math.floor(entry.z / tileSize)))
    const stepX = Math.sign(ray.direction.x)
    const stepZ = Math.sign(ray.direction.z)
    const strideX = tileSize / Math.abs(ray.direction.x)
    const strideZ = tileSize / Math.abs(ray.direction.z)
    let nextX = stepX
        ? ((x + (stepX > 0 ? 1 : 0)) * tileSize - ray.origin.x) / ray.direction.x
        : Infinity
    let nextZ = stepZ
        ? ((z + (stepZ > 0 ? 1 : 0)) * tileSize - ray.origin.z) / ray.direction.z
        : Infinity

    const a = new Vector3()
    const b = new Vector3()
    const c = new Vector3()
    const hit = new Vector3()
    while (x >= 0 && x < columns && z >= 0 && z < rows) {
        const first = (z * columns + x) * indicesPerCell
        let nearest = Infinity
        for (let i = first; i < first + indicesPerCell; i += 3) {
            a.fromBufferAttribute(positions, index.getX(i))
            b.fromBufferAttribute(positions, index.getX(i + 1))
            c.fromBufferAttribute(positions, index.getX(i + 2))
            if (ray.intersectTriangle(a, b, c, false, hit)) {
                nearest = Math.min(nearest, hit.distanceTo(ray.origin))
            }
        }
        if (nearest <= maxDistance) return nearest

        // Advance to the next cell, crossing both edges when the ray hits a corner.
        const next = Math.min(nextX, nextZ)
        if (next > maxDistance) return
        if (nextX === next) {
            x += stepX
            nextX += strideX
        }
        if (nextZ === next) {
            z += stepZ
            nextZ += strideZ
        }
    }
}
