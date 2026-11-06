import { config } from '+config'
import { WalkableActorRenderer } from '+game/renderer/lib/WalkableActorRenderer'
import { ActorType, ClockInfo } from '+game/types'
import { Tile } from '+game/world/Tile'

import { Bone, MathUtils, MeshStandardMaterial, Skeleton, SkinnedMesh } from 'three'

import { BoarActor } from './BoarActor'
import { createBoarGeometry } from './boarGeometry'

interface BoarGait {
    skeleton: Skeleton
    x: number
    z: number
    phase: number
    blend: number
}

export class BoarRenderer extends WalkableActorRenderer<BoarActor> {
    public actorType = ActorType.Boar

    private material = new MeshStandardMaterial({ vertexColors: true, flatShading: true })
    private model = createBoarGeometry()
    private gaits = new WeakMap<BoarActor, BoarGait>()

    public destroy() {
        super.destroy()
        for (const actor of this.actorGroupMap.keys()) {
            this.gaits.get(actor)?.skeleton.dispose()
        }
        this.model.geometry.dispose()
        this.material.dispose()
    }

    protected onRemoveActor(actor: BoarActor) {
        super.onRemoveActor(actor)
        this.gaits.get(actor)?.skeleton.dispose()
        this.gaits.delete(actor)
    }

    public createActorModel(actor: BoarActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)
        const actorModel = new SkinnedMesh(this.model.geometry, this.material)
        const body = new Bone()
        body.name = 'body'

        const legs = this.model.legPivots.map((pivot) => {
            const leg = new Bone()
            leg.name = `${pivot.z > 0 ? 'front' : 'rear'}_${pivot.x > 0 ? 'right' : 'left'}`
            leg.position.copy(pivot)
            body.add(leg)
            return leg
        })

        const skeleton = new Skeleton([body, ...legs])
        actorModel.add(body)
        actorModel.bind(skeleton)
        actorModel.computeBoundingSphere()
        actorModel.boundingSphere!.radius += 0.25
        actorModel.castShadow = true
        actorModel.receiveShadow = true
        actorModel.scale.setScalar(config.renderer.tileSize)
        group.add(actorModel)

        this.gaits.set(actor, {
            skeleton,
            x: group.position.x,
            z: group.position.z,
            phase: 0,
            blend: 0,
        })

        return { group, interactionShape }
    }

    protected updatePosition(clockInfo: ClockInfo) {
        super.updatePosition(clockInfo)
        const { deltaTime } = clockInfo
        if (deltaTime <= 0) return

        for (const [actor, { position }] of this.actorGroupMap) {
            const gait = this.gaits.get(actor)!
            const distance = Math.hypot(position.x - gait.x, position.z - gait.z)
            gait.x = position.x
            gait.z = position.z

            const speed = distance / (deltaTime * config.renderer.tileSize)
            const blend = MathUtils.smoothstep(speed, 0.08, 2.5)
            gait.blend = MathUtils.damp(gait.blend, blend, 15, deltaTime)
            const cyclesPerSecond = Math.min(speed / 0.65, 4)
            gait.phase =
                (gait.phase + cyclesPerSecond * deltaTime * Math.PI * 2) % (Math.PI * 2)

            const [body, ...legs] = gait.skeleton.bones
            body!.position.y = (1 - Math.cos(gait.phase * 2)) * 0.026 * gait.blend
            body!.rotation.z = Math.sin(gait.phase) * 0.06 * gait.blend

            for (const [index, leg] of legs.entries()) {
                // Opposite corners step together. The lifted pair swings forward.
                const diagonal = Math.sign(leg.position.x * leg.position.z)
                const swing = Math.cos(gait.phase) * diagonal
                const lift = Math.max(0, Math.sin(gait.phase) * diagonal)
                leg.rotation.x = swing * 0.53 * gait.blend
                leg.position.y =
                    this.model.legPivots[index]!.y + lift * 0.085 * gait.blend
            }
        }
    }
}
