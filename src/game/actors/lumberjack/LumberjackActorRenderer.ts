import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { Tile } from '+game/Tile'
import { ActorType } from '+game/types'

import { Mesh, MeshStandardMaterial, SphereGeometry } from 'three'

import { LumberjackActor } from './LumberjackActor'

export class LumberjackActorRenderer extends ActorRenderer<LumberjackActor> {
    public actorType = ActorType.Lumberjack

    private material = new MeshStandardMaterial({ color: 0xff4070 })
    private geometry = new SphereGeometry(0.5, 5, 4)

    public createActorModel(actor: LumberjackActor, tile: Tile) {
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
