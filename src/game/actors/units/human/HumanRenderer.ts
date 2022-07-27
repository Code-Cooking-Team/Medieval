import { config } from '+config'
import { ACTOR_MODEL_OBJECT3D_NAME } from '+game/const'
import { Profession } from '+game/professions/Profession'
import { WalkableActorRenderer } from '+game/renderer/lib/WalkableActorRenderer'
import { Tile } from '+game/Tile'
import { ActorType, ClockInfo } from '+game/types'

import { Mesh, MeshStandardMaterial, NotEqualDepth, SphereGeometry } from 'three'

import { HumanActor } from './HumanActor'

export class HumanRenderer extends WalkableActorRenderer<HumanActor> {
    public actorType = ActorType.Human

    private material = new MeshStandardMaterial({ color: config.human.color })
    private geometry = new SphereGeometry(0.5, 5, 5)

    public createActorModel(actor: HumanActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)
        const actorModel = new Mesh(this.geometry, this.material)

        this.material.depthFunc = NotEqualDepth;
        actorModel.name = ACTOR_MODEL_OBJECT3D_NAME
        actorModel.castShadow = true
        actorModel.receiveShadow = true
        actorModel.scale.y = 2
        actorModel.scale.z = 0.5
        actorModel.position.y = 0.5

        group.add(actorModel)

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
