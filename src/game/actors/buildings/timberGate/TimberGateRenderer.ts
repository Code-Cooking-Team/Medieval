import { ACTOR_MODEL_OBJECT3D_NAME } from '+game/const'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { ActorType, type ClockInfo } from '+game/types'
import { type Tile } from '+game/world/Tile'
import { updateScale } from '+helpers/three'

import { type Group, Mesh } from 'three'

import { type TimberGateActor } from './TimberGateActor'
import { cloneGateModel, poseGateLeaves } from './timberGateBlueprint'

export class TimberGateRenderer extends ActorRenderer<TimberGateActor> {
    public actorType = ActorType.TimberGate
    private gates = new Map<TimberGateActor, { model: Group; openness: number }>()

    public createActorModel(actor: TimberGateActor, tile: Tile) {
        const result = super.createActorModel(actor, tile)
        const model = cloneGateModel()
        model.name = ACTOR_MODEL_OBJECT3D_NAME
        updateScale(model)
        const openness = Number(actor.open)
        poseGateLeaves(model, openness)
        result.group.add(model)
        this.gates.set(actor, { model, openness })
        return result
    }

    public render(clockInfo: ClockInfo) {
        super.render(clockInfo)
        for (const [actor, gate] of this.gates) {
            const target = Number(actor.open)
            if (gate.openness === target) continue
            // A delayed frame can include time before the player toggled the gate.
            const step = Math.min(clockInfo.deltaTime, 0.15) / 1.1
            gate.openness = actor.open
                ? Math.min(target, gate.openness + step)
                : Math.max(target, gate.openness - step)
            const eased = gate.openness ** 2 * (3 - 2 * gate.openness)
            poseGateLeaves(gate.model, eased)
        }
    }

    public getSolidMeshes() {
        const meshes: Mesh[] = []
        for (const { model } of this.gates.values()) {
            model.traverse((object) => {
                if (object instanceof Mesh) meshes.push(object)
            })
        }
        return meshes
    }

    protected onRemoveActor(actor: TimberGateActor) {
        super.onRemoveActor(actor)
        this.gates.delete(actor)
    }
}
