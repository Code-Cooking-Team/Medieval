import { config } from '+config'
import { Game } from '+game/Game'
import { ActorType, ClockInfo, Renderable } from '+game/types'
import { multiplyPosition, seededRandom, updateObjectPosition } from '+helpers'

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
} from 'three'

import { TreeActor } from './TreeActor'

export class TreeRenderer implements Renderable {
    public actorType: ActorType = ActorType.Tree

    private boughGeometry = new CylinderGeometry(0.2, 0.4, 3, 3)
    private boughMaterial = new MeshStandardMaterial({
        color: new Color().setHex(0x2e2625, LinearSRGBColorSpace),
        metalness: 0.8,
        roughness: 1,
    })

    private coronaGeometry = new SphereGeometry(1.5, 5, 4)
    private coronaMaterial = new MeshStandardMaterial({
        color: new Color().setHex(0x2c420b, LinearSRGBColorSpace),
        metalness: 0.8,
        roughness: 0.9,
        flatShading: true,
    })

    public group = new Group()
    private dummy = new Object3D()
    private capacity = 0
    private meshes: InstancedMesh[] = []

    constructor(public game: Game) {}

    private createMesh(
        geometry: CylinderGeometry | SphereGeometry,
        material: MeshStandardMaterial,
        height: number,
    ) {
        const mesh = new InstancedMesh(geometry, material, this.capacity)
        mesh.count = 0
        mesh.instanceMatrix.setUsage(DynamicDrawUsage)
        mesh.castShadow = true
        mesh.receiveShadow = true
        // This batch spans the map and moves with the wind. Skip per-frame bounds scans.
        mesh.frustumCulled = false
        mesh.position.y = height * config.renderer.tileSize
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
                this.createMesh(this.boughGeometry, this.boughMaterial, 1.8),
                this.createMesh(this.coronaGeometry, this.coronaMaterial, 4.5),
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
                const sendX = dummy.scale.z * rnd(-0.5, 0.5)
                const sendZ = dummy.scale.z * rnd(-0.5, 0.5)
                dummy.rotation.z +=
                    Math.sin(sendX + time * 0.2 * (sendX * (Math.PI / 1))) / 15

                dummy.position.x +=
                    Math.sin(sendX + time * 0.2 * (sendX * (Math.PI / 1))) / -8

                dummy.rotation.x +=
                    Math.sin(sendZ + time * 0.2 * (sendZ * (Math.PI / 1))) / 15

                dummy.position.z +=
                    Math.sin(sendZ + time * 0.2 * (sendZ * (Math.PI / 1))) / 8
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
}
