import { WalkableActorRenderer } from '+game/renderer/lib/WalkableActorRenderer'
import { Tile } from '+game/Tile'
import { ActorType } from '+game/types'

import { Mesh, MeshStandardMaterial, SphereGeometry } from 'three'

import { BoarActor } from './BoarActor'

export class BoarRenderer extends WalkableActorRenderer<BoarActor> {
    public actorType = ActorType.Boar

    private material = new MeshStandardMaterial({ color: 0x4a2505 })
    private geometry = new SphereGeometry(0.5, 5, 5)

    public createActorModel(actor: BoarActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)
        const actorModel = new Mesh(this.geometry, this.material)

        actorModel.castShadow = true
        actorModel.receiveShadow = true
        actorModel.scale.y = 0.5
        actorModel.scale.x = 0.5
        actorModel.scale.z = 1
        actorModel.position.y = 0.5

        group.add(actorModel)

        return { group, interactionShape }
    }
}
