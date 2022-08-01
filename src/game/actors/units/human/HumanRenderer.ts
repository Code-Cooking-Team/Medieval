import { config } from '+config'
import { ACTOR_MODEL_OBJECT3D_NAME } from '+game/const'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { Profession } from '+game/professions/Profession'
import { WalkableActorRenderer } from '+game/renderer/lib/WalkableActorRenderer'
import { ActorType, ClockInfo } from '+game/types'
import { Tile } from '+game/world/Tile'
import { loadAnimationGLTF, loadGLTF } from '+helpers'

import {
    AnimationClip,
    AnimationMixer,
    Mesh,
    MeshStandardMaterial,
    NotEqualDepth,
    SphereGeometry,
} from 'three'

import { HumanActor } from './HumanActor'
import humanModelUrl from './models/human.gltf'

export class HumanRenderer extends WalkableActorRenderer<HumanActor> {
    public actorType = ActorType.Human
    private animationList?: AnimationClip[]

    public createActorModel(actor: HumanActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)
        // const actorModel = new Mesh(this.geometry, this.material)

        const actorModel = loadAnimationGLTF(humanModelUrl)
        actorModel.then((gltf) => {
            this.animationList = gltf.animations
            actor.animationMixer = new AnimationMixer(gltf.scene)
            console.log(gltf.scene)
            if (this.animationList) {
                actor.animationMixer.clipAction(this.animationList[0]!).play()
            }

            if (gltf.scene) {
                gltf.scene.name = ACTOR_MODEL_OBJECT3D_NAME
                group.add(gltf.scene)
            }
        })

        // this.material.depthFunc = NotEqualDepth
        // actorModel.name = ACTOR_MODEL_OBJECT3D_NAME
        // actorModel.castShadow = true
        // actorModel.receiveShadow = true
        // actorModel.scale.y = 2
        // actorModel.scale.z = 0.5
        // actorModel.position.y = 0.5

        return { group, interactionShape }
    }

    private swapToProfessionActorModel(actor: HumanActor) {
        const group = this.actorGroupMap.get(actor)!
        if (!actor.profession) return

        group.remove(group.getObjectByName(ACTOR_MODEL_OBJECT3D_NAME) as Mesh)

        const actorModel = actor.profession.getModel()

        group.add(actorModel)
    }

    public render(clockInfo: ClockInfo): void {
        super.render(clockInfo)
        this.actorGroupMap.forEach((group, actor) => {
            if (actor.animationMixer && this.animationList) {
                if (actor.hasPath() && actor.actorState != 'walking') {
                    actor.animationMixer.stopAllAction()
                    actor.animationMixer.clipAction(this.animationList[1]!).play()
                    actor.actorState = 'walking'
                }
                if (!actor.hasPath() && actor.actorState != 'idle') {
                    actor.animationMixer.stopAllAction()
                    actor.animationMixer.clipAction(this.animationList[0]!).play()
                    actor.actorState = 'idle'
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
            // this.swapToProfessionActorModel(actor)
        })
    }
}
