import { config } from '+config'
import { ACTOR_MODEL_OBJECT3D_NAME } from '+game/const'
import { Profession } from '+game/professions/Profession'
import { ProfessionType } from '+game/professions/types'
import { WalkableActorRenderer } from '+game/renderer/lib/WalkableActorRenderer'
import { ActorType, ClockInfo } from '+game/types'
import { Tile } from '+game/world/Tile'
import {
    changeColorLightnessSaturation,
    generateSimilarColor,
    loadRawGLTF,
    updateScale,
} from '+helpers'

import {
    AnimationAction,
    AnimationMixer,
    MathUtils,
    MeshStandardMaterial,
    SkinnedMesh,
} from 'three'

import { HumanActor } from './HumanActor'
import humanModelUrl from './models/human.gltf'

interface HumanLocomotion {
    mixer: AnimationMixer
    idle: AnimationAction
    walk: AnimationAction
    x: number
    z: number
    blend: number
}

export class HumanRenderer extends WalkableActorRenderer<HumanActor> {
    public actorType = ActorType.Human
    private locomotion = new WeakMap<HumanActor, HumanLocomotion>()

    public destroy() {
        super.destroy()
        for (const actor of this.actorGroupMap.keys()) this.onRemoveActor(actor)
    }

    protected onRemoveActor(actor: HumanActor) {
        super.onRemoveActor(actor)
        const animation = this.locomotion.get(actor)
        if (animation) {
            const { mixer } = animation
            mixer.stopAllAction()
            mixer.uncacheRoot(mixer.getRoot())
            this.locomotion.delete(actor)
        }
    }

    public createActorModel(actor: HumanActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        loadRawGLTF(humanModelUrl).then((gltf) => {
            if (this.actorGroupMap.get(actor) !== group) return

            const [idleClip, walkClip] = gltf.animations
            if (idleClip && walkClip) {
                const mixer = new AnimationMixer(gltf.scene)
                const idle = mixer.clipAction(idleClip).play()
                const walk = mixer.clipAction(walkClip).setEffectiveWeight(0).play()
                mixer.update(0)

                const { x, z } = group.position
                this.locomotion.set(actor, { mixer, idle, walk, x, z, blend: 0 })
            }

            if (gltf.scene) {
                gltf.scene.name = ACTOR_MODEL_OBJECT3D_NAME

                updateScale(gltf.scene)

                const shirtModel = gltf.scene.getObjectByName('Cube001_1') as SkinnedMesh
                if (shirtModel && shirtModel.material) {
                    shirtModel.material = new MeshStandardMaterial({
                        color: changeColorLightnessSaturation(
                            generateSimilarColor(0x273021, 20),
                            false,
                            0.25,
                        ),
                        roughness: 1,
                        metalness: 0,
                    })
                }

                gltf.scene.position.y = 0.025 * config.renderer.tileSize

                group.add(gltf.scene)
            }
        })

        // This can be used to make humans visible behind buildings
        // this.material.depthFunc = NotEqualDepth

        return { group, interactionShape }
    }

    private swapToProfessionActorModel(actor: HumanActor) {
        const group = this.actorGroupMap.get(actor)!
        if (!actor.profession) return

        const shirtModel = group.getObjectByName('Cube001_1') as SkinnedMesh
        if (shirtModel && shirtModel.material) {
            if (actor.profession.type === ProfessionType.Woodcutter) {
                shirtModel.material = new MeshStandardMaterial({
                    color: changeColorLightnessSaturation(
                        generateSimilarColor(config.woodcutter.color, 6),
                        false,
                        0.25,
                    ),
                    roughness: 1,
                    metalness: 0,
                })
            }
            if (actor.profession.type === ProfessionType.Guardian) {
                shirtModel.material = new MeshStandardMaterial({
                    color: generateSimilarColor(0x999999, 10, true),
                    roughness: 0.1,
                    metalness: 0.9,
                })
            }
        }
    }

    public render(clockInfo: ClockInfo): void {
        super.render(clockInfo)
        this.updateProfession()
    }

    protected updatePosition(clockInfo: ClockInfo) {
        super.updatePosition(clockInfo)
        const { deltaTime } = clockInfo
        if (deltaTime <= 0) return

        for (const [actor, { position }] of this.actorGroupMap) {
            const animation = this.locomotion.get(actor)
            if (!animation) continue

            const distance = Math.hypot(
                position.x - animation.x,
                position.z - animation.z,
            )
            animation.x = position.x
            animation.z = position.z

            const speed = distance / (deltaTime * config.renderer.tileSize)
            const targetBlend = MathUtils.smoothstep(speed, 0.08, 1.5)
            animation.blend = MathUtils.damp(animation.blend, targetBlend, 12, deltaTime)
            animation.idle.setEffectiveWeight(1 - animation.blend)
            animation.walk.setEffectiveWeight(animation.blend)
            // Keep the stride advancing as the walk fades into idle.
            animation.walk.setEffectiveTimeScale(MathUtils.clamp(speed / 2, 0.5, 1.5))
            animation.mixer.update(deltaTime)
        }
    }

    private actorPreviousProfession = new WeakMap<HumanActor, Profession>()

    protected updateProfession() {
        this.actorGroupMap.forEach((group, actor) => {
            if (!actor.profession) return
            if (this.actorPreviousProfession.get(actor) === actor.profession) return
            this.actorPreviousProfession.set(actor, actor.profession)
            this.swapToProfessionActorModel(actor)
        })
    }
}
