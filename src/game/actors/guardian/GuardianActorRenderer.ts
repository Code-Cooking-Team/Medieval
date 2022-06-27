import { Actor } from '+game/core/Actor'
import { Tile } from '+game/Tile'
import { ActorType } from '+game/types'
import { Clock, Mesh, MeshStandardMaterial, SphereGeometry } from 'three'
import { ActorRenderer } from '../../renderer/lib/ActorRenderer'

export class GuardianActorRenderer extends ActorRenderer {
    public actorType = ActorType.Guardian

    private material = new MeshStandardMaterial({ color: 0x40ff70 })
    private geometry = new SphereGeometry(0.5, 5, 5)

    public createActorModel(actor: Actor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)
        const body = new Mesh(this.geometry, this.material)

        body.castShadow = true
        body.receiveShadow = true
        body.scale.y = 2
        body.position.y = 0.5

        group.add(body)

        return { group, interactionShape }
    }
}
