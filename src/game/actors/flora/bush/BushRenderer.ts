import { config } from '+config'
import { Game } from '+game/Game'
import { ActorType, Renderable } from '+game/types'
import { seededRandom, updateObjectPosition } from '+helpers'

import {
    DynamicDrawUsage,
    Group,
    IcosahedronGeometry,
    InstancedMesh,
    MeshStandardMaterial,
    Object3D,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

import { BushActor } from './BushActor'

function createBushGeometry() {
    const leaves = [
        new IcosahedronGeometry(0.75).scale(1, 0.8, 1).translate(0, 0.55, 0),
        new IcosahedronGeometry(0.55).translate(-0.63, 0.4, 0.13),
        new IcosahedronGeometry(0.5).translate(0.59, 0.36, 0.28),
    ]
    const geometry = mergeGeometries(leaves)
    for (const part of leaves) part.dispose()
    return geometry
}

export class BushRenderer implements Renderable {
    public group = new Group()
    private geometry = createBushGeometry()
    private material = new MeshStandardMaterial({ color: 0x516329, flatShading: true })
    private dummy = new Object3D()
    private mesh?: InstancedMesh
    private capacity = 0

    constructor(public game: Game) {}

    public render() {
        const bushes = this.game.findActorsByType(ActorType.Bush)
        if (bushes.length > this.capacity) {
            this.releaseMesh()
            this.capacity = Math.max(bushes.length, this.capacity * 2)
            this.mesh = new InstancedMesh(this.geometry, this.material, this.capacity)
            this.mesh.instanceMatrix.setUsage(DynamicDrawUsage)
            this.mesh.castShadow = true
            this.mesh.receiveShadow = true
            this.mesh.frustumCulled = false
            this.group.add(this.mesh)
        }
        if (!this.mesh) return

        const { dummy, mesh } = this
        mesh.count = 0
        for (const bush of bushes) {
            const tile = this.game.world.getTile(bush.position)
            if (!BushActor.growsOn(tile.type)) continue

            const rnd = seededRandom(bush.seed)
            updateObjectPosition(dummy, bush.position, tile.height)
            dummy.scale.setScalar(config.renderer.tileSize * rnd(0.65, 1.1))
            dummy.rotation.y = rnd(0, Math.PI * 2)
            dummy.updateMatrix()
            mesh.setMatrixAt(mesh.count++, dummy.matrix)
        }

        if (mesh.count > 0) {
            mesh.instanceMatrix.clearUpdateRanges()
            mesh.instanceMatrix.addUpdateRange(0, mesh.count * 16)
            mesh.instanceMatrix.needsUpdate = true
        }
    }

    private releaseMesh() {
        if (!this.mesh) return
        this.group.remove(this.mesh)
        this.mesh.dispose()
    }

    public destroy() {
        this.releaseMesh()
        this.geometry.dispose()
        this.material.dispose()
    }
}
