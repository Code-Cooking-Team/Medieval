import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { WalkableActorRenderer } from '+game/renderer/lib/WalkableActorRenderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'

import { Mesh, MeshStandardMaterial, SphereGeometry } from 'three'

import { BoarActor } from './BoarActor'
import { config } from '+config'

export class BoarRenderer extends WalkableActorRenderer<BoarActor> {
    public actorType = ActorType.Boar

    private material = new MeshStandardMaterial({ color: 0x4a2505 })
    private geometry = new SphereGeometry(0.7 * config.renderer.tileSize, 5, 5)

    public createActorModel(actor: BoarActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)
        const actorModel = new Mesh(this.geometry, this.material)

        actorModel.castShadow = true
        actorModel.receiveShadow = true
        actorModel.scale.y = 0.5
        actorModel.scale.x = 0.5
        actorModel.scale.z = 1
        actorModel.position.y = 0.5 * config.renderer.tileSize

        group.add(actorModel)

        return { group, interactionShape }
    }
}
