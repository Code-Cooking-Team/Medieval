import { config } from '+config'
import { Tree } from '+game/actors/Tree'
import { Actor } from '+game/core/Actor'
import { ActorType, Position } from '+game/types'
import { Tile } from '+game/Word'
import { random } from '+helpers/basic'
import {
    Clock,
    CylinderGeometry,
    DoubleSide,
    Group,
    Mesh,
    MeshStandardMaterial,
    PlaneGeometry,
    SphereGeometry,
} from 'three'
import { Game } from '../Game'
import { ActorRenderer } from './lib/ActorRenderer'
import { ItemRenderer } from './lib/ItemRenderer'

export class TreeRenderer extends ActorRenderer {
    public actorType = ActorType.Tree

    private boughMaterial = new MeshStandardMaterial({ color: 0x2e2625 })
    private branchesMaterial = new MeshStandardMaterial({ color: 0x00660a })
    private boughGeometry = new CylinderGeometry(0.2, 0.4, 3, 3)
    private branchesGeometry = new SphereGeometry(1.5, 5, 4)

    public render(clock: Clock) {
        super.render(clock)
        Object.values(this.actorGroupRef).forEach(({ actor, group }) => {
            if (actor.hp <= actor.maxHp * 0.75) {
                group.rotation.x += (Math.PI / 2.2 - group.rotation.x) * this.moveSpeed
            }
            if (actor.isDead()) {
                group.position.y -= 0.04
            }
        })
    }

    public createActorModel(actor: Actor, tile: Tile) {
        const group = super.createActorModel(actor, tile)

        const bough = new Mesh(this.boughGeometry, this.boughMaterial)
        bough.castShadow = true
        bough.receiveShadow = true
        bough.name = 'bough'
        bough.position.y = 3 / 2

        const branches = new Mesh(this.branchesGeometry, this.branchesMaterial)
        branches.castShadow = true
        branches.receiveShadow = true
        branches.name = 'branches'
        branches.position.y = 3 / 2 + 2

        const localGroup = new Group()

        localGroup.add(bough)
        localGroup.add(branches)

        const treeSize = random(0.5, 1)
        localGroup.scale.set(treeSize, random(0.5, 1), treeSize)
        localGroup.rotateY(random(0, Math.PI))
        localGroup.rotateX(random(Math.PI / -30, Math.PI / 30))
        localGroup.rotateZ(random(Math.PI / -30, Math.PI / 30))

        group.add(localGroup)

        return group
    }
}
