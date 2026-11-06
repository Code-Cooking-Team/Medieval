import { config } from '+config'
import { BuildingActor } from '+game/core/BuildingActor'
import { ClockInfo } from '+game/types'
import { rotationIndexToDeg } from '+helpers'

import { Camera, Matrix4, Vector3 } from 'three'

import { ActorRenderer } from './ActorRenderer'
import { BuildingBatch, BuildingSlot } from './BuildingBatch'
import { BuildingModel, BuildingPrimitive } from './BuildingModel'

interface Placement {
    level: number
    outlined: boolean
    matrix: Matrix4
    primitives: BuildingPrimitive[]
    slots: { batch: BuildingBatch; slot: BuildingSlot; local: Matrix4 }[]
}

export abstract class InstancedBuildingRenderer<
    TActor extends BuildingActor,
> extends ActorRenderer<TActor> {
    private placements = new Map<TActor, Placement>()
    private batches = new Map<string, BuildingBatch>()
    private outlinedBatches = new Map<string, BuildingBatch>()
    private cameraPosition = new Vector3()
    private actorPosition = new Vector3()
    private matrix = new Matrix4()
    private modelReady = false

    protected abstract buildingModel: BuildingModel

    public init() {
        super.init()
        void this.buildingModel.ready.then(() => {
            this.modelReady = true
        })
    }

    public render(clockInfo: ClockInfo, camera?: Camera) {
        super.render(clockInfo)
        if (!this.modelReady || !camera) return

        // Actor matrices and batches are local to the same centered renderer group.
        camera.getWorldPosition(this.cameraPosition)
        this.group.worldToLocal(this.cameraPosition)
        const outline =
            config.postProcessing.postprocessingEnabled &&
            config.postProcessing.outlineEnabled
        const selected = new Set(outline ? this.player.selectedActors : [])

        for (const [actor, group] of this.actorGroupMap) {
            const previous = this.placements.get(actor)
            const distance = this.actorPosition
                .copy(group.position)
                .distanceTo(this.cameraPosition)
            const level = this.getLevel(distance, previous?.level ?? 0)
            const outlined = selected.has(actor)
            group.rotation.y = rotationIndexToDeg(actor.rotation)
            group.updateMatrix()

            if (previous?.level !== level || previous.outlined !== outlined) {
                if (previous) this.release(previous)
                const primitives =
                    previous?.level === level
                        ? previous.primitives
                        : this.buildingModel.getPrimitives(level, actor.seed)
                const slots = primitives.map(({ mesh, matrix }) => {
                    const batch = this.getBatch(mesh, level, outlined)
                    const slot = batch.add(
                        this.matrix.multiplyMatrices(group.matrix, matrix),
                    )
                    return { batch, slot, local: matrix }
                })
                this.placements.set(actor, {
                    level,
                    outlined,
                    matrix: group.matrix.clone(),
                    primitives,
                    slots,
                })
            } else if (!previous.matrix.equals(group.matrix)) {
                previous.matrix.copy(group.matrix)
                for (const { batch, slot, local } of previous.slots) {
                    batch.write(slot, this.matrix.multiplyMatrices(group.matrix, local))
                }
            }
        }

        for (const batch of this.batches.values()) batch.flush()
        for (const batch of this.outlinedBatches.values()) batch.flush()
    }

    public getSelectedGroups() {
        // OutlinePass can mask the whole batch because it contains only selected actors.
        return Array.from(this.outlinedBatches.values(), ({ mesh }) => mesh).filter(
            (mesh) => mesh.count > 0,
        )
    }

    protected onRemoveActor(actor: TActor) {
        super.onRemoveActor(actor)
        const placement = this.placements.get(actor)
        if (placement) this.release(placement)
        this.placements.delete(actor)
    }

    public destroy() {
        super.destroy()
        for (const batch of this.batches.values()) batch.destroy()
        for (const batch of this.outlinedBatches.values()) batch.destroy()
        this.batches.clear()
        this.outlinedBatches.clear()
        this.placements.clear()
    }

    private getLevel(distance: number, previous: number) {
        const levels = this.buildingModel.levels
        for (let level = levels.length - 1; level > 0; level--) {
            const threshold = levels[level]!.distanceInTiles * config.renderer.tileSize
            if (distance >= threshold * (previous >= level ? 0.9 : 1)) return level
        }
        return 0
    }

    private getBatch(
        source: BuildingPrimitive['mesh'],
        level: number,
        outlined: boolean,
    ) {
        const materials = Array.isArray(source.material)
            ? source.material
            : [source.material]
        const key = [
            level,
            source.geometry.id,
            materials.map(({ id }) => id).join(','),
            source.castShadow,
            source.receiveShadow,
        ].join(':')
        const batches = outlined ? this.outlinedBatches : this.batches
        let batch = batches.get(key)
        if (!batch) {
            batch = new BuildingBatch(this.group, source)
            batches.set(key, batch)
        }
        return batch
    }

    private release(placement: Placement) {
        for (const { batch, slot } of placement.slots) batch.remove(slot)
    }
}
