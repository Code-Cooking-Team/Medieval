import { WalkableActor } from '+game/core/WalkableActor'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { Tile } from '+game/Tile'
import { ActorType } from '+game/types'

import { Mesh, MeshStandardMaterial, SphereGeometry } from 'three'

export class HumanActorRenderer extends ActorRenderer<WalkableActor> {
    public actorType = ActorType.Human

    private material = new MeshStandardMaterial({ color: 0xe0ac69 })
    private geometry = new SphereGeometry(0.5, 5, 5)

    public createActorModel(actor: WalkableActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)
        const body = new Mesh(this.geometry, this.material)

        body.castShadow = true
        body.receiveShadow = true
        body.scale.y = 2
        body.scale.z = 0.5
        body.position.y = 0.5

        group.add(body)

        return { group, interactionShape }
    }
}
