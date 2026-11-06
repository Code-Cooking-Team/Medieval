import { config } from '+config'
import { Game } from '+game/Game'
import { ActorType, ClockInfo, Renderable } from '+game/types'
import { seededRandom, updateObjectPosition } from '+helpers'

import {
    Color,
    CylinderGeometry,
    DynamicDrawUsage,
    Group,
    InstancedMesh,
    LinearSRGBColorSpace,
    MeshStandardMaterial,
    Object3D,
    SphereGeometry,
    Vector3,
} from 'three'

import { TreeActor } from './TreeActor'

// The crown props up the fallen trunk.
const fallenAngle = (80 * Math.PI) / 180
const fallDamage = 10
const fallDuration = 0.95

export class TreeRenderer implements Renderable {
    public actorType: ActorType = ActorType.Tree

    // Both meshes share a pivot at the base of the trunk.
    private boughGeometry = new CylinderGeometry(0.2, 0.4, 3, 3).translate(0, 1.5, 0)
    private boughMaterial = new MeshStandardMaterial({
        color: new Color().setHex(0x2e2625, LinearSRGBColorSpace),
        metalness: 0.8,
        roughness: 1,
    })

    private coronaGeometry = new SphereGeometry(1.5, 5, 4).translate(0, 3.6, 0)
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
    private meshes: InstancedMesh[] = []

    constructor(public game: Game) {}

    private createMesh(
        geometry: CylinderGeometry | SphereGeometry,
        material: MeshStandardMaterial,
    ) {
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
        for (const mesh of this.meshes) {
            this.group.remove(mesh)
            mesh.dispose()
        }
    }

    public destroy() {
        this.releaseMeshes()
        this.boughGeometry.dispose()
        this.boughMaterial.dispose()
        this.coronaGeometry.dispose()
        this.coronaMaterial.dispose()
    }

    public render(clockInfo: ClockInfo) {
        const time = clockInfo.elapsedTime * 5
        const treeActors = this.game.findActorsByType(this.actorType) as TreeActor[]
        const { dummy } = this

        if (treeActors.length > this.capacity) {
            this.releaseMeshes()
            this.capacity = Math.max(treeActors.length, this.capacity * 2)
            this.meshes = [
                this.createMesh(this.boughGeometry, this.boughMaterial),
                this.createMesh(this.coronaGeometry, this.coronaMaterial),
            ]
        }

        for (const [index, tree] of treeActors.entries()) {
            const rnd = seededRandom(tree.seed)
            const tile = this.game.world.getTile(tree.position)

            updateObjectPosition(dummy, tree.position, tile.height)

            dummy.scale.set(
                rnd(0.8, 1.5) * config.renderer.tileSize,
                rnd(1, 1.5) * config.renderer.tileSize,
                rnd(0.8, 1.5) * config.renderer.tileSize,
            )

            dummy.rotation.set(
                rnd(-0.5, 0.5) / Math.PI,
                rnd(-0.5, 0.5) / Math.PI,
                rnd(-0.5, 0.5) / Math.PI,
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

            if (tree.maxHp - tree.hp >= fallDamage || tree.hp <= 0) {
                this.applyFall(tree, clockInfo.deltaTime)
            }

            dummy.updateMatrix()
            for (const mesh of this.meshes) mesh.setMatrixAt(index, dummy.matrix)
        }

        for (const mesh of this.meshes) {
            mesh.count = treeActors.length
            if (mesh.count > 0) {
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
    }
}
