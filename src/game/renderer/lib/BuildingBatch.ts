import { DynamicDrawUsage, InstancedMesh, Matrix4, type Object3D } from 'three'

import { type BuildingPrimitive } from './BuildingModel'

export interface BuildingSlot {
    index: number
}

export class BuildingBatch {
    public mesh: InstancedMesh
    private slots: BuildingSlot[] = []
    private scratch = new Matrix4()
    private dirty = false

    constructor(
        private parent: Object3D,
        private source: BuildingPrimitive['mesh'],
    ) {
        this.mesh = this.createMesh(16)
    }

    public add(matrix: Matrix4): BuildingSlot {
        if (this.slots.length === this.mesh.instanceMatrix.count) {
            const previous = this.mesh
            this.mesh = this.createMesh(this.slots.length * 2)
            this.mesh.instanceMatrix.array.set(previous.instanceMatrix.array)
            previous.removeFromParent()
            previous.dispose()
        }

        const slot = { index: this.slots.length }
        this.slots.push(slot)
        this.write(slot, matrix)
        return slot
    }

    public remove(slot: BuildingSlot) {
        const last = this.slots.pop()!
        if (last !== slot) {
            this.mesh.getMatrixAt(last.index, this.scratch)
            last.index = slot.index
            this.slots[last.index] = last
            this.write(last, this.scratch)
        }
        this.dirty = true
    }

    public write(slot: BuildingSlot, matrix: Matrix4) {
        this.mesh.setMatrixAt(slot.index, matrix)
        this.mesh.instanceMatrix.addUpdateRange(slot.index * 16, 16)
        this.mesh.instanceMatrix.needsUpdate = true
        this.dirty = true
    }

    public flush() {
        if (!this.dirty) return
        this.mesh.count = this.slots.length
        this.mesh.visible = this.mesh.count > 0
        this.mesh.computeBoundingSphere()
        this.dirty = false
    }

    public destroy() {
        this.mesh.removeFromParent()
        this.mesh.dispose()
    }

    private createMesh(capacity: number) {
        const mesh = new InstancedMesh(
            this.source.geometry,
            this.source.material,
            capacity,
        )
        mesh.instanceMatrix.setUsage(DynamicDrawUsage)
        mesh.castShadow = this.source.castShadow
        mesh.receiveShadow = this.source.receiveShadow
        mesh.count = 0
        mesh.visible = false
        this.parent.add(mesh)
        return mesh
    }
}
