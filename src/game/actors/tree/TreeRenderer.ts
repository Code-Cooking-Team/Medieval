import { config } from '+config'
import { Actor } from '+game/core/Actor'
import { Tile } from '+game/Tile'
import { ActorType, ClockInfo } from '+game/types'
import { random } from '+helpers/basic'
import {
    Clock,
    CylinderGeometry,
    Group,
    Mesh,
    MeshStandardMaterial,
    SphereGeometry,
} from 'three'
import { ActorRenderer } from '../../renderer/lib/ActorRenderer'

export class TreeRenderer extends ActorRenderer {
    public actorType = ActorType.Tree

    private boughMaterial = new MeshStandardMaterial({ color: 0x2e2625 })
    private branchesMaterial = new MeshStandardMaterial({ color: 0x2c420b })
    private boughGeometry = new CylinderGeometry(0.2, 0.4, 3, 3)
    private branchesGeometry = new SphereGeometry(1.5, 5, 4)

    public render(clockInfo: ClockInfo) {
        super.render(clockInfo)

        Object.values(this.actorGroupRef).forEach(({ actor, group }) => {
            const time = clockInfo.elapsedTime * 10

            if (actor.hp <= actor.maxHp * 0.75) {
                group.rotation.x += (Math.PI / 2.2 - group.rotation.x) * this.moveSpeed
            } else {
                if (config.renderer.treeWaving) {
                    const treeSend = group.children[1].scale.z / 10
                    group.rotation.z =
                        Math.sin(treeSend + time * 0.2 * (treeSend * (Math.PI / 1))) / 10
                }
            }
            if (actor.isDead()) {
                group.position.y -= 0.05
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
