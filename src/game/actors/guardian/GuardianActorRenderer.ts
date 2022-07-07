import { WalkableActor } from '+game/core/WalkableActor'
import { WalkableActorRenderer } from '+game/renderer/lib/WalkableActorRenderer'
import { Tile } from '+game/Tile'
import { ActorType } from '+game/types'

import { Mesh, MeshStandardMaterial, SphereGeometry } from 'three'

export class GuardianActorRenderer extends WalkableActorRenderer<WalkableActor> {
    public actorType = ActorType.Guardian

    private material = new MeshStandardMaterial({ color: 0x40ff70 })
    private geometry = new SphereGeometry(0.5, 5, 5)

    public createActorModel(actor: WalkableActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)
        const body = new Mesh(this.geometry, this.material)
        const pike = new Mesh(
            this.geometry,
            new MeshStandardMaterial({ color: 0xcccccc }),
        )

        body.castShadow = true
        body.receiveShadow = true
        body.scale.y = 2
        body.scale.z = 0.5
        body.position.y = 0.5

        pike.position.z = 0.25
        pike.position.y = 1
        pike.position.x = -0.25
        pike.scale.x = 0.1
        pike.scale.y = -0.01
        pike.scale.z = 2
        pike.rotation.x = Math.PI / -4

        group.add(body)
        group.add(pike)

        return { group, interactionShape }
    }
}
