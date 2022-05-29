import { Actor } from '+game/core/Actor'
import { ActorType } from '+game/types'
import { Tile } from '+game/Word'
import { Clock, Mesh, MeshStandardMaterial, SphereGeometry } from 'three'
import { ActorRenderer } from './lib/ActorRenderer'

export class LumberjackRenderer extends ActorRenderer {
    public actorType = ActorType.Lumberjack

    private material = new MeshStandardMaterial({ color: 0xff4070 })
    private geometry = new SphereGeometry(1.5, 5, 4)

    public createActorModel(actor: Actor, tile: Tile) {
        const group = super.createActorModel(actor, tile)
        const body = new Mesh(this.geometry, this.material)
        group.add(body)
        return group
    }

    public render(clock: Clock) {
        this.updatePosition()
    }
}
