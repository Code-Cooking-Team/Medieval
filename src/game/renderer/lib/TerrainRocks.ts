import { SMALL_ROCK_TOP } from '+game/world/rockPlacement'
import { RockTile } from '+game/world/Tile'
import { TileType } from '+game/world/types'
import { type World } from '+game/world/World'
import { seededRandom } from '+helpers/random'

import {
    type BufferGeometry,
    Color,
    Float32BufferAttribute,
    Group,
    InstancedMesh,
    type Intersection,
    LinearSRGBColorSpace,
    Mesh,
    type MeshStandardMaterial,
    Object3D,
    type Raycaster,
    Vector3,
} from 'three'
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

import { createCliffGeometry } from './createCliffGeometry'
import { createCliffShelfGeometry } from './createCliffShelfGeometry'

// Each tier specifies its center, height range and width at either end.
const rockProfiles = [
    [[0, 0, -0.26, SMALL_ROCK_TOP * 2, 0.96, 0.65]],
    [
        [-0.12, 0, -0.28, 1.08, 0.79, 0.56],
        [0.06, 0.32, -0.22, 0.52, 0.46, 0.3],
        [-0.22, -0.04, 0.88, 1.67, 0.54, 0.25],
    ],
    [
        [0.04, 0, -0.28, 1.12, 0.84, 0.61],
        [-0.37, 0.18, -0.25, 0.74, 0.47, 0.27],
        [0.11, -0.04, 0.94, 1.91, 0.53, 0.35],
        [0.02, -0.12, 1.78, 2.85, 0.31, 0.09],
    ],
] as const

function rockGeometry(variant: number, width: number, height: number) {
    const random = seededRandom(341 + variant)
    const tiers = rockProfiles[variant]!.map(([cx, cz, bottom, top, base, crown]) => {
        const points: Vector3[] = []
        const turn = random(-0.35, 0.35)
        for (let side = 0; side < 5; side++) {
            const angle = turn + (side * Math.PI * 2) / 5
            const x = Math.sin(angle) * random(0.88, 1.07)
            const z = Math.cos(angle) * random(0.88, 1.07)
            points.push(
                new Vector3(cx + x * base, bottom, cz + z * base),
                new Vector3(
                    cx + x * crown - 0.09,
                    variant === 0 ? top : top + random(-0.16, 0.13),
                    cz + z * crown,
                ),
            )
        }
        return new ConvexGeometry(points)
    })
    const geometry = mergeGeometries(tiers)
    for (const tier of tiers) tier.dispose()
    const position = geometry.getAttribute('position')
    const colors = new Float32Array(position.count * 3).fill(1)
    const uv = new Float32Array(position.count * 2)
    for (let index = 0; index < position.count; index++) {
        uv[index * 2] = (position.getX(index) + position.getZ(index)) / width
        uv[index * 2 + 1] = position.getY(index) / height
    }
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
    geometry.computeBoundingBox()
    return geometry
}

export class TerrainRocks {
    public readonly group = new Group()
    private readonly cliffs: Mesh<BufferGeometry, MeshStandardMaterial>
    private readonly shelves: Mesh<BufferGeometry, MeshStandardMaterial>
    private shelfRevision: number
    private readonly batches: InstancedMesh[]

    constructor(
        private readonly world: World,
        private readonly tileSize: number,
        groundMaterial: MeshStandardMaterial,
    ) {
        this.cliffs = new Mesh(createCliffGeometry(world, tileSize), groundMaterial)
        this.cliffs.receiveShadow = true
        this.cliffs.raycast = () => {}
        this.shelves = new Mesh(createCliffShelfGeometry(world, tileSize), groundMaterial)
        this.shelves.castShadow = this.shelves.receiveShadow = true
        this.shelves.raycast = () => {}
        this.shelves.visible = this.shelves.geometry.hasAttribute('position')
        this.shelfRevision = world.tileRevision
        this.group.add(this.cliffs, this.shelves)
        const [width, height] = world.getSize()
        this.batches = rockProfiles.map((_, variant) => {
            const batch = new InstancedMesh(
                rockGeometry(variant, width, height),
                groundMaterial,
                64,
            )
            batch.castShadow = true
            batch.receiveShadow = true
            batch.raycast = () => {}
            this.group.add(batch)
            return batch
        })
    }

    public raycast(raycaster: Raycaster) {
        const hits: Intersection[] = []
        if (this.shelves.geometry.hasAttribute('position')) {
            this.shelves.updateWorldMatrix(true, false)
            Mesh.prototype.raycast.call(this.shelves, raycaster, hits)
        }
        for (const batch of this.batches) {
            batch.updateWorldMatrix(true, false)
            InstancedMesh.prototype.raycast.call(batch, raycaster, hits)
        }
        return hits
    }

    public update() {
        if (this.shelfRevision !== this.world.tileRevision) {
            this.shelfRevision = this.world.tileRevision
            this.shelves.geometry.dispose()
            this.shelves.geometry = createCliffShelfGeometry(this.world, this.tileSize)
            this.shelves.visible = this.shelves.geometry.hasAttribute('position')
        }
        const color = new Color()
        const groundTint = new Color()
        const transform = new Object3D()
        for (const batch of this.batches) batch.count = 0
        this.world.forEachTile((tile, [x, y]) => {
            if (!(tile instanceof RockTile)) return
            const random = seededRandom(
                (this.world.seed ?? 0) ^
                    Math.imul(x + 1, 73856093) ^
                    Math.imul(y + 1, 19349663),
            )
            const variant =
                tile.rockSize === 1 ? 0 : Math.floor(random(1, rockProfiles.length))
            let batch = this.batches[variant]!
            if (batch.count === batch.instanceMatrix.count) {
                const expanded = new InstancedMesh(
                    batch.geometry,
                    batch.material,
                    batch.count * 2,
                )
                expanded.count = batch.count
                expanded.instanceMatrix.array.set(batch.instanceMatrix.array)
                expanded.setColorAt(0, color)
                expanded.instanceColor!.array.set(batch.instanceColor!.array)
                expanded.castShadow = batch.castShadow
                expanded.receiveShadow = batch.receiveShadow
                expanded.raycast = batch.raycast
                this.group.remove(batch)
                batch.dispose()
                this.group.add(expanded)
                this.batches[variant] = batch = expanded
            }

            const center = (tile.rockSize - 1) / 2
            const scale = tile.rockSize / 2
            const bounds = batch.geometry.boundingBox!
            const radius =
                scale *
                Math.hypot(
                    Math.max(-bounds.min.x, bounds.max.x),
                    Math.max(-bounds.min.z, bounds.max.z),
                )
            let baseHeight = tile.height + bounds.min.y * scale
            // A terrain triangle cannot dip below its lowest corner.
            for (
                let row = Math.floor(y + center - radius);
                row <= Math.ceil(y + center + radius);
                row++
            ) {
                for (
                    let col = Math.floor(x + center - radius);
                    col <= Math.ceil(x + center + radius);
                    col++
                ) {
                    const ground = this.world.tiles[row]?.[col]
                    if (ground) baseHeight = Math.min(baseHeight, ground.height - 0.12)
                }
            }
            const crownHeight = tile.height + bounds.max.y * scale
            const verticalScale =
                (crownHeight - baseHeight) / (bounds.max.y - bounds.min.y)
            transform.position.set(
                (x + center) * this.tileSize,
                (crownHeight - bounds.max.y * verticalScale) * this.tileSize,
                (y + center) * this.tileSize,
            )
            transform.rotation.y = random(0, Math.PI * 2)
            transform.scale.set(
                scale * this.tileSize,
                verticalScale * this.tileSize,
                scale * this.tileSize,
            )
            transform.updateMatrix()
            groundTint.setHex(tile.color, LinearSRGBColorSpace)
            color
                .setHex(0x595852, LinearSRGBColorSpace)
                .lerp(groundTint, 0.32)
                .multiplyScalar(random(0.78, 1.1))
            batch.setMatrixAt(batch.count, transform.matrix)
            batch.setColorAt(batch.count, color)
            batch.count++
        })
        for (const batch of this.batches) {
            batch.instanceMatrix.needsUpdate = true
            if (batch.instanceColor) batch.instanceColor.needsUpdate = true
            batch.computeBoundingSphere()
        }
    }

    public dispose() {
        for (const batch of this.batches) {
            batch.geometry.dispose()
            batch.dispose()
        }
        this.cliffs.geometry.dispose()
        this.shelves.geometry.dispose()
    }
}
