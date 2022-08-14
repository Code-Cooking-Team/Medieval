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

import { AnimationClip, AnimationMixer, MeshStandardMaterial, SkinnedMesh } from 'three'

import { HumanActor } from './HumanActor'
import humanModelUrl from './models/human.gltf'

export class HumanRenderer extends WalkableActorRenderer<HumanActor> {
    public actorType = ActorType.Human
    private animationList?: AnimationClip[]

    public createActorModel(actor: HumanActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        loadRawGLTF(humanModelUrl).then((gltf) => {
            this.animationList = gltf.animations
            actor.animationMixer = new AnimationMixer(gltf.scene)
            if (this.animationList) {
                actor.animationMixer.clipAction(this.animationList[0]!).play()
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
        this.actorGroupMap.forEach((group, actor) => {
            if (actor.animationMixer && this.animationList) {
                if (actor.hasPath() && actor.actorAnimationState != 'walking') {
                    actor.animationMixer.stopAllAction()
                    actor.animationMixer.clipAction(this.animationList[1]!).play()
                    actor.actorAnimationState = 'walking'
                }
                if (!actor.hasPath() && actor.actorAnimationState != 'idle') {
                    actor.animationMixer.stopAllAction()
                    actor.animationMixer.clipAction(this.animationList[0]!).play()
                    actor.actorAnimationState = 'idle'
                }
                actor.animationMixer.update(clockInfo.deltaTime)
            }
        })
        this.updateProfession()
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
