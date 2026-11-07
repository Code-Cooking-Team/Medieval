import { config } from '+config'
import { ACTOR_MODEL_OBJECT3D_NAME } from '+game/const'
import { Profession } from '+game/professions/Profession'
import { ProfessionType } from '+game/professions/types'
import { WoodcutterProfession } from '+game/professions/WoodcutterProfession'
import { WalkableActorRenderer } from '+game/renderer/lib/WalkableActorRenderer'
import { ActorType, ClockInfo } from '+game/types'
import { Tile } from '+game/world/Tile'
import {
    changeColorLightnessSaturation,
    generateSimilarColor,
    isSamePosition,
    loadRawGLTF,
    updateScale,
} from '+helpers'

import {
    AdditiveAnimationBlendMode,
    AnimationAction,
    AnimationClip,
    AnimationMixer,
    LoopOnce,
    MathUtils,
    MeshStandardMaterial,
    Object3D,
    PropertyBinding,
    Quaternion,
    QuaternionKeyframeTrack,
    SkinnedMesh,
    Vector3,
} from 'three'

import { EquipmentSlot, ItemId } from './equipment'
import { carriedLogModel, equipmentModels } from './equipmentModels'
import { HumanActor } from './HumanActor'
import humanModelUrl from './models/human.gltf'

type EquipmentVisual = ItemId | 'carriedLog' | null

interface HumanLocomotion {
    mixer: AnimationMixer
    idle: AnimationAction
    walk: AnimationAction
    attack: AnimationAction
    chop: AnimationAction
    lastAction: HumanActor['lastAction']
    handVisual: EquipmentVisual
    carryPose: ReturnType<typeof bindCarryPose>
    x: number
    z: number
    blend: number
}

// Placeholder clips share the same action slots as future captured animations.
function createSwingClip(name: string, axis: Vector3, times: number[], angles: number[]) {
    const arm = PropertyBinding.sanitizeNodeName('mixamorig:RightArm')
    const values = angles.flatMap((angle) =>
        new Quaternion().setFromAxisAngle(axis, angle).toArray(),
    )
    return new AnimationClip(
        name,
        times[times.length - 1],
        [new QuaternionKeyframeTrack(`${arm}.quaternion`, times, values)],
        AdditiveAnimationBlendMode,
    )
}

const attackClip = createSwingClip(
    'attack',
    new Vector3(0, 0, 1),
    [0, 0.06, 0.13, 0.24],
    [0, -0.55, 0.9, 0],
)
const chopClip = createSwingClip(
    'chop',
    new Vector3(1, 0, 0),
    [0, 0.17, 0.25, 0.44],
    [0, -1.7, 0.65, 0],
)
// These bones extend along local -X. Raise the hand to the shoulder with the
// elbow forward, and keep the log aligned with the model's forward (+Z) axis.
const armAxis = new Vector3(-1, 0, 0)
const carryArm = new Quaternion().setFromUnitVectors(
    armAxis,
    new Vector3(-0.22, -0.6, 0.77).normalize(),
)
const carryForearm = new Quaternion().setFromUnitVectors(
    armAxis,
    new Vector3(0.14, 0.9, -0.41).normalize(),
)
const carryHand = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2)
const carryPose = [
    ['RightArm', carryArm],
    ['RightForeArm', carryArm.clone().invert().multiply(carryForearm)],
    ['RightHand', carryForearm.clone().invert().multiply(carryHand)],
] as const

function bindCarryPose(model: Object3D) {
    return carryPose.flatMap(([name, rotation]) => {
        const bone = model.getObjectByName(`mixamorig${name}`)
        return bone ? [{ bone, rotation, animatedRotation: new Quaternion() }] : []
    })
}

const equipmentSlots: EquipmentSlot[] = ['Hands', 'Armor']

export class HumanRenderer extends WalkableActorRenderer<HumanActor> {
    public actorType = ActorType.Human
    private locomotion = new WeakMap<HumanActor, HumanLocomotion>()

    private attachments = new WeakMap<
        Object3D,
        Map<EquipmentSlot, { id: EquipmentVisual; model?: Object3D }>
    >()

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
                const attack = mixer.clipAction(attackClip).setLoop(LoopOnce, 1)
                const chop = mixer.clipAction(chopClip).setLoop(LoopOnce, 1)
                mixer.update(0)

                const { x, z } = group.position
                this.locomotion.set(actor, {
                    mixer,
                    idle,
                    walk,
                    attack,
                    chop,
                    lastAction: actor.lastAction,
                    handVisual: actor.getEquippedItem('Hands'),
                    carryPose: bindCarryPose(gltf.scene),
                    x,
                    z,
                    blend: 0,
                })
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
        for (const [actor, group] of this.actorGroupMap) {
            const model = group.getObjectByName(ACTOR_MODEL_OBJECT3D_NAME)
            if (model) this.updateEquipment(actor, model)
        }
    }

    protected getFacingTarget(actor: HumanActor) {
        const animation = this.locomotion.get(actor)
        const action = actor.lastAction
        if (!animation || !action || !isSamePosition(actor.position, action.origin))
            return

        if (animation.lastAction !== action || animation[action.kind].isRunning()) {
            return action.target
        }
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
            // Restore the mixer's last result before it evaluates the next frame.
            // The carry pose only replaces the right arm, so the legs still walk.
            if (animation.handVisual === 'carriedLog') {
                for (const { bone, animatedRotation } of animation.carryPose) {
                    bone.quaternion.copy(animatedRotation)
                }
            }
            const action = actor.lastAction
            if (animation.lastAction !== action) {
                animation.lastAction = action
                animation.attack.stop()
                animation.chop.stop()
                if (action && isSamePosition(actor.position, action.origin)) {
                    animation[action.kind].reset().play()
                }
            }
            if (action && !isSamePosition(actor.position, action.origin)) {
                animation[action.kind].stop()
            }
            animation.mixer.update(deltaTime)
            animation.handVisual = this.getHandVisual(actor, animation)
            if (animation.handVisual === 'carriedLog') {
                for (const { bone, rotation, animatedRotation } of animation.carryPose) {
                    animatedRotation.copy(bone.quaternion)
                    bone.quaternion.copy(rotation)
                }
            }
        }
    }

    private getHandVisual(
        actor: HumanActor,
        animation: HumanLocomotion,
    ): EquipmentVisual {
        const equipped = actor.getEquippedItem('Hands')
        if (animation.attack.isRunning()) return equipped
        if (animation.chop.isRunning()) return 'hatchet'

        const profession = actor.profession
        if (profession instanceof WoodcutterProfession) {
            if (profession.isChopping) return 'hatchet'
            if (profession.hasWood) return 'carriedLog'
        }
        return equipped
    }

    private updateEquipment(actor: HumanActor, skeletonRoot: Object3D) {
        let attachments = this.attachments.get(skeletonRoot)
        if (!attachments) {
            attachments = new Map()
            this.attachments.set(skeletonRoot, attachments)
        }

        const animation = this.locomotion.get(actor)
        for (const slot of equipmentSlots) {
            const id =
                slot === 'Hands' && animation
                    ? animation.handVisual
                    : actor.getEquippedItem(slot)
            const previous = attachments.get(slot)
            if (previous?.id === id) continue
            previous?.model?.removeFromParent()

            const visual =
                id === 'carriedLog' ? carriedLogModel : id && equipmentModels[id]
            const bone =
                visual &&
                skeletonRoot.getObjectByName(
                    PropertyBinding.sanitizeNodeName(visual.bone),
                )
            if (id && visual && bone) {
                const model = visual.model.clone()
                model.name = id
                model.position.set(...visual.position)
                model.rotation.set(...visual.rotation)
                model.scale.set(...visual.scale)
                bone.add(model)
                attachments.set(slot, { id, model })
            } else {
                attachments.set(slot, { id })
            }
        }
    }

    private actorPreviousProfession = new WeakMap<HumanActor, Profession>()

    protected updateProfession() {
        this.actorGroupMap.forEach((group, actor) => {
            if (!actor.profession || !group.getObjectByName(ACTOR_MODEL_OBJECT3D_NAME))
                return
            if (this.actorPreviousProfession.get(actor) === actor.profession) return
            this.actorPreviousProfession.set(actor, actor.profession)
            this.swapToProfessionActorModel(actor)
        })
    }
}
