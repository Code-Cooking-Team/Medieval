import { config } from '+config'
import { Game } from '+game/Game'
import { ActorType, ClockInfo, Renderable } from '+game/types'
import { seededRandom, updateObjectPosition } from '+helpers'

import {
    BufferGeometry,
    Color,
    CylinderGeometry,
    DynamicDrawUsage,
    Group,
    InstancedMesh,
    LinearSRGBColorSpace,
    MeshStandardMaterial,
    Object3D,
    Quaternion,
    SphereGeometry,
    Vector3,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

import { TreeActor } from './TreeActor'

// The crown props up the fallen trunk.
const fallenAngle = (80 * Math.PI) / 180
const fallDamage = 10
const fallDuration = 0.95
const standingLean = (18 * Math.PI) / 180
const treeSizes = [1, 0.85, 1.2]

const forks = [
    { start: 1.15, tip: new Vector3(1.5, 2.55, 0), radius: 0.85 },
    { start: 1.65, tip: new Vector3(0.75, 3.15, -1.55), radius: 0.75 },
    { start: 0.95, tip: new Vector3(0.9, 2.25, 1.5), radius: 0.8 },
]

function createTreeModel(branchCount: number) {
    const trunk = new CylinderGeometry(0.2, 0.4, 3, 3).translate(0, 1.5, 0)
    const crown = new SphereGeometry(1.5, 5, 4).translate(0, 3.6, 0)
    const detailedCrown = new SphereGeometry(1.5, 7, 5).translate(0, 3.6, 0)
    const leanAxis = new Vector3()
    if (branchCount === 0) return { trunk, crown, detailedCrown, leanAxis }

    const wood: BufferGeometry[] = [trunk]
    const foliage: BufferGeometry[] = [crown]
    const detailedFoliage: BufferGeometry[] = [detailedCrown]
    const up = new Vector3(0, 1, 0)
    for (const { start, tip, radius } of forks.slice(0, branchCount)) {
        const base = new Vector3(0, start, 0)
        const direction = tip.clone().sub(base)
        const rotation = new Quaternion().setFromUnitVectors(
            up,
            direction.clone().normalize(),
        )
        const midpoint = base.lerp(tip, 0.5)
        wood.push(
            new CylinderGeometry(0.09, 0.22, direction.length(), 3)
                .applyQuaternion(rotation)
                .translate(midpoint.x, midpoint.y, midpoint.z),
        )
        foliage.push(
            new SphereGeometry(radius, 5, 4).translate(tip.x, tip.y + 0.2, tip.z),
        )
        detailedFoliage.push(
            new SphereGeometry(radius, 7, 5).translate(tip.x, tip.y + 0.2, tip.z),
        )
        // Rotating around this axis tilts the trunk away from the branch tips.
        leanAxis.x -= tip.z
        leanAxis.z += tip.x
    }

    const model = {
        trunk: mergeGeometries(wood),
        crown: mergeGeometries(foliage),
        detailedCrown: mergeGeometries(detailedFoliage),
        leanAxis: leanAxis.normalize(),
    }
    for (const part of [...wood, ...foliage, ...detailedFoliage]) part.dispose()
    return model
}

export class TreeRenderer implements Renderable {
    public actorType: ActorType = ActorType.Tree

    // Both meshes share a pivot at the base of the trunk.
    private models = [0, 1, 2, 3].map(createTreeModel)
    private boughMaterial = new MeshStandardMaterial({
        color: new Color().setHex(0x2e2625, LinearSRGBColorSpace),
        metalness: 0.8,
        roughness: 1,
    })

    private coronaMaterial = new MeshStandardMaterial({
        color: new Color().setHex(0x2c420b, LinearSRGBColorSpace),
        metalness: 0.8,
        roughness: 0.9,
        flatShading: true,
    })

    public group = new Group()
    private dummy = new Object3D()
    private falls = new WeakMap<
        TreeActor,
        { axis: Vector3; twist: number; fallTime: number }
    >()
    private capacity = 0
    private batches: [InstancedMesh, InstancedMesh, InstancedMesh][] = []

    constructor(public game: Game) {}

    private createMesh(geometry: BufferGeometry, material: MeshStandardMaterial) {
        const mesh = new InstancedMesh(geometry, material, this.capacity)
        mesh.count = 0
        mesh.instanceMatrix.setUsage(DynamicDrawUsage)
        mesh.castShadow = true
        mesh.receiveShadow = true
        // This batch spans the map and moves with the wind. Skip per-frame bounds scans.
        mesh.frustumCulled = false
        this.group.add(mesh)
        return mesh
    }

    private releaseMeshes() {
        for (const mesh of this.batches.flat()) {
            this.group.remove(mesh)
            mesh.dispose()
        }
    }

    public destroy() {
        this.releaseMeshes()
        for (const { trunk, crown, detailedCrown } of this.models) {
            trunk.dispose()
            crown.dispose()
            detailedCrown.dispose()
        }
        this.boughMaterial.dispose()
        this.coronaMaterial.dispose()
    }

    public render(clockInfo: ClockInfo) {
        const time = clockInfo.elapsedTime * 5
        const treeActors = this.game.findActorsByType(this.actorType) as TreeActor[]
        const { dummy } = this

        if (treeActors.length > this.capacity) {
            this.releaseMeshes()
            this.capacity = Math.max(treeActors.length, this.capacity * 2)
            this.batches = this.models.map(({ trunk, crown, detailedCrown }) => [
                this.createMesh(trunk, this.boughMaterial),
                this.createMesh(crown, this.coronaMaterial),
                this.createMesh(detailedCrown, this.coronaMaterial),
            ])
        }

        for (const [trunk, crown, detailedCrown] of this.batches) {
            trunk.count = crown.count = detailedCrown.count = 0
        }

        for (const tree of treeActors) {
            // Use separate digits of the saved seed for size and branch count.
            const seed = Math.floor(tree.seed)
            const size = treeSizes[seed % treeSizes.length]!
            const branchCount = Math.floor(seed / treeSizes.length) % this.models.length
            const [trunk, crown, detailedCrown] = this.batches[branchCount]!
            const rnd = seededRandom(tree.seed)
            const tile = this.game.world.getTile(tree.position)

            updateObjectPosition(dummy, tree.position, tile.height)

            const scale = size * config.renderer.tileSize
            dummy.scale.set(
                rnd(0.8, 1.5) * scale,
                rnd(1, 1.5) * scale,
                rnd(0.8, 1.5) * scale,
            )

            const tilt = branchCount === 0 ? 1 / Math.PI : 0
            dummy.rotation.set(
                rnd(-0.5, 0.5) * tilt,
                rnd(-Math.PI, Math.PI),
                rnd(-0.5, 0.5) * tilt,
            )

            if (config.renderer.treeWaving) {
                const swayAngle = 0.17
                const phaseX = dummy.scale.z * rnd(-0.5, 0.5)
                const phaseZ = dummy.scale.z * rnd(-0.5, 0.5)
                dummy.rotation.z +=
                    Math.sin(phaseX + time * 0.2 * phaseX * Math.PI) * swayAngle

                dummy.rotation.x +=
                    Math.sin(phaseZ + time * 0.2 * phaseZ * Math.PI) * swayAngle
            }

            const falling = tree.maxHp - tree.hp >= fallDamage || tree.hp <= 0
            const fallProgress = falling ? this.applyFall(tree, clockInfo.deltaTime) : 0
            if (branchCount > 0) {
                dummy.rotateOnAxis(
                    this.models[branchCount]!.leanAxis,
                    standingLean * (1 - fallProgress),
                )
            }

            dummy.updateMatrix()
            trunk.setMatrixAt(trunk.count++, dummy.matrix)
            const canopy = size > 1 ? detailedCrown : crown
            canopy.setMatrixAt(canopy.count++, dummy.matrix)
        }

        for (const batch of this.batches) {
            for (const mesh of batch) {
                if (mesh.count === 0) continue
                mesh.instanceMatrix.clearUpdateRanges()
                mesh.instanceMatrix.addUpdateRange(0, mesh.count * 16)
                mesh.instanceMatrix.needsUpdate = true
            }
        }
    }

    private applyFall(tree: TreeActor, deltaTime: number) {
        let fall = this.falls.get(tree)
        if (!fall) {
            const rnd = seededRandom(tree.seed ^ 0x6a09e667)
            const direction = rnd(0, Math.PI * 2)
            fall = {
                axis: new Vector3(Math.sin(direction), 0, Math.cos(direction)),
                twist: rnd(-0.35, 0.35),
                fallTime: 0,
            }
            this.falls.set(tree, fall)
        }

        fall.fallTime = Math.min(fall.fallTime + deltaTime, fallDuration)
        const progress = (fall.fallTime / fallDuration) ** 2
        this.dummy.rotation.x *= 1 - progress
        this.dummy.rotation.z *= 1 - progress
        this.dummy.rotateOnWorldAxis(fall.axis, fallenAngle * progress)
        this.dummy.rotateY(fall.twist * progress)
        return progress
    }
}
