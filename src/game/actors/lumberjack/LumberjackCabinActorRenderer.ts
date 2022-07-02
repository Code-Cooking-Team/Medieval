import { config } from '+config'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { Tile } from '+game/Tile'
import { ActorType } from '+game/types'

import {
    BoxGeometry,
    Mesh,
    MeshStandardMaterial,
    OctahedronGeometry,
    PointLight,
} from 'three'

import { LumberjackCabinActor } from './LumberjackCabinActor'

export class LumberjackCabinActorRenderer extends ActorRenderer<LumberjackCabinActor> {
    public actorType = ActorType.LumberjackCabin

    private wallMaterial = new MeshStandardMaterial({ color: 0x4d4d4d })
    private roofMaterial = new MeshStandardMaterial({ color: 0x800e00 })
    private wallGeometry = new BoxGeometry(2, 2, 2)
    private roofGeometry = new OctahedronGeometry(1.5, 0)

    public createActorModel(actor: LumberjackCabinActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)
        const [x, y] = actor.position

        const wall = new Mesh(this.wallGeometry, this.wallMaterial)
        const door = new Mesh(this.wallGeometry, this.wallMaterial)
        wall.castShadow = true
        wall.receiveShadow = true

        const roof = new Mesh(this.roofGeometry, this.roofMaterial)
        roof.castShadow = true
        roof.receiveShadow = true

        door.position.set(0, 0.5, 1)
        door.scale.set(0.5, 1, 0.5)
        wall.position.y = 1
        roof.rotation.y = Math.PI / 4
        roof.position.y = 2

        wall.name = 'wall'
        roof.name = 'roof'

        if (config.lumberjack.cabinLight) {
            const light = new PointLight(0xfa840e, 1, 15)
            light.position.set(0, 3, 0)
            group.add(light)
        }

        group.add(wall)
        group.add(door)
        group.add(roof)

        return { group, interactionShape }
    }
}
