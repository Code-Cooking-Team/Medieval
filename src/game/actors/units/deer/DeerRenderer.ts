import { config } from '+config'
import { ACTOR_MODEL_OBJECT3D_NAME } from '+game/const'
import { WalkableActorRenderer } from '+game/renderer/lib/WalkableActorRenderer'
import { ActorType, type ClockInfo } from '+game/types'
import { type Tile } from '+game/world/Tile'

import {
    Bone,
    MathUtils,
    MeshStandardMaterial,
    Quaternion,
    Skeleton,
    SkinnedMesh,
    Vector3,
} from 'three'

import { type DeerActor } from './DeerActor'
import { createDeerGeometry } from './deerGeometry'

interface DeerPose {
    skeleton: Skeleton
    body: Bone
    neck: Bone
    legs: Bone[]
    x: number
    z: number
    stride: number
    walking: number
    grazing: number
}

export class DeerRenderer extends WalkableActorRenderer<DeerActor> {
    public actorType = ActorType.Deer

    private model = createDeerGeometry()
    private material = new MeshStandardMaterial({ vertexColors: true, flatShading: true })
    private poses = new Map<DeerActor, DeerPose>()
    private up = new Vector3(0, 1, 0)
    private heading = new Quaternion()

    public destroy() {
        super.destroy()
        for (const { skeleton } of this.poses.values()) skeleton.dispose()
        this.poses.clear()
        this.model.geometry.dispose()
        this.material.dispose()
    }

    protected onRemoveActor(actor: DeerActor) {
        super.onRemoveActor(actor)
        this.poses.get(actor)?.skeleton.dispose()
        this.poses.delete(actor)
    }

    public createActorModel(actor: DeerActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)
        const model = new SkinnedMesh(this.model.geometry, this.material)
        model.name = ACTOR_MODEL_OBJECT3D_NAME
        const body = new Bone()
        body.name = 'body'
        const neck = new Bone()
        neck.name = 'neck'
        neck.position.set(0, 0.73, 0.25)
        body.add(neck)

        const legs = this.model.legPivots.map((pivot) => {
            const leg = new Bone()
            leg.name = `${pivot.z > 0 ? 'front' : 'rear'}_${pivot.x > 0 ? 'right' : 'left'}`
            leg.position.copy(pivot)
            body.add(leg)
            return leg
        })

        const skeleton = new Skeleton([body, neck, ...legs])
        model.add(body)
        model.bind(skeleton)
        model.computeBoundingSphere()
        // The lowered neck reaches farther forward than in the standing pose.
        model.boundingSphere!.radius += 0.4
        model.castShadow = true
        model.receiveShadow = true
        model.scale.setScalar(config.renderer.tileSize)
        group.add(model)

        this.poses.set(actor, {
            skeleton,
            body,
            neck,
            legs,
            x: group.position.x,
            z: group.position.z,
            stride: 0,
            walking: 0,
            grazing: 0,
        })
        return { group, interactionShape }
    }

    protected updateRotation({ deltaTime }: ClockInfo) {
        const tileSize = config.renderer.tileSize
        for (const [actor, group] of this.actorGroupMap) {
            const x = actor.position[0] * tileSize - group.position.x
            const z = actor.position[1] * tileSize - group.position.z
            if (Math.hypot(x, z) < tileSize * 0.025) continue

            this.heading.setFromAxisAngle(this.up, Math.atan2(x, z))
            group.quaternion.rotateTowards(
                this.heading,
                deltaTime * config.walkableRenderer.rotationSmoothness,
            )
        }
    }

    protected updatePosition(clockInfo: ClockInfo) {
        super.updatePosition(clockInfo)
        const { deltaTime, elapsedTime } = clockInfo
        if (deltaTime <= 0) return

        for (const [actor, { position }] of this.actorGroupMap) {
            const pose = this.poses.get(actor)!
            const distance = Math.hypot(position.x - pose.x, position.z - pose.z)
            pose.x = position.x
            pose.z = position.z

            const speed = distance / (deltaTime * config.renderer.tileSize)
            const walking = MathUtils.smoothstep(speed, 0.07, 1.5)
            pose.walking = MathUtils.damp(pose.walking, walking, 10, deltaTime)
            pose.stride =
                (pose.stride + (distance / config.renderer.tileSize) * Math.PI * 2) %
                (Math.PI * 2)
            const grazing = actor.isFleeing || actor.hasPath() || speed > 0.12 ? 0 : 1
            pose.grazing = MathUtils.damp(pose.grazing, grazing, 4, deltaTime)

            const chew = elapsedTime * 7 + actor.seed
            pose.neck.rotation.x = (1.81 + Math.sin(chew) * 0.045) * pose.grazing
            pose.neck.rotation.y = Math.sin(chew * 0.31) * 0.08 * pose.grazing
            pose.body.position.y = (1 - Math.cos(pose.stride * 2)) * 0.012 * pose.walking

            for (const [index, leg] of pose.legs.entries()) {
                // Stagger all four footfalls for a walk.
                const offset = [0, Math.PI, Math.PI * 1.5, Math.PI * 0.5][index]!
                const phase = pose.stride + offset
                const swing = actor.isFleeing ? 0.48 : 0.34
                leg.rotation.x = Math.cos(phase) * swing * pose.walking
                leg.position.y =
                    this.model.legPivots[index]!.y +
                    Math.max(0, Math.sin(phase)) * 0.075 * pose.walking
            }
        }
    }
}
