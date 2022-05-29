import { config } from '+config'
import { Tree } from '+game/actors/Tree'
import { Actor } from '+game/core/Actor'
import { ActorType, Position } from '+game/types'
import { Tile } from '+game/Word'
import {
    BoxGeometry,
    Clock,
    DoubleSide,
    Group,
    Mesh,
    MeshStandardMaterial,
    OctahedronGeometry,
    PlaneGeometry,
} from 'three'
import { Game } from '../Game'
import { ActorRenderer } from './lib/ActorRenderer'
import { ItemRenderer } from './lib/ItemRenderer'

export class LumberjackCabinRenderer extends ActorRenderer {
    public actorType = ActorType.LumberjackCabin

    private wallMaterial = new MeshStandardMaterial({ color: 0x4d4d4d })
    private roofMaterial = new MeshStandardMaterial({ color: 0x800e00 })
    private wallGeometry = new BoxGeometry(2, 2, 2)
    private roofGeometry = new OctahedronGeometry(1.5, 0)

    public render(clock: Clock) {
        Object.values(this.actorGroupRef).forEach(({ actor, group }) => {
            if (actor.isDead()) {
                group.scale.y = 0.1
            }
        })
    }

    public createActorModel(actor: Actor, tile: Tile) {
        const group = super.createActorModel(actor, tile)
        const [x, y] = actor.position

        const wall = new Mesh(this.wallGeometry, this.wallMaterial)
        const roof = new Mesh(this.roofGeometry, this.roofMaterial)

        wall.position.y = 1
        roof.rotation.y = Math.PI / 4
        roof.position.y = 2

        wall.name = 'wall'
        roof.name = 'roof'
        group.add(wall)
        group.add(roof)

        return group
    }
}
