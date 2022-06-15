import { config } from '+config'
import { Actor } from '+game/core/Actor'
import { Game } from '+game/Game'
import { Tile } from '+game/Tile'
import { ActorType } from '+game/types'
import { random } from '+helpers/basic'
import {
    Clock,
    CylinderGeometry,
    DoubleSide,
    DynamicDrawUsage,
    Group,
    InstancedMesh,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Object3D,
    PlaneGeometry,
    SphereGeometry,
} from 'three'
import { ActorRenderer } from '../../renderer/lib/ActorRenderer'
import { TreeActor } from './TreeActor'

export class TreeRenderer {
    public actorType: ActorType = ActorType.Tree
    public moveSpeed = 0.04

    private boughMaterial = new MeshStandardMaterial({ color: 0x2e2625 })
    private boughGeometry = new CylinderGeometry(0.2, 0.4, 3, 3)

    // private coronaMaterial = new MeshStandardMaterial({ color: 0x2c420b })
    // private coronaGeometry = new SphereGeometry(1.5, 5, 4)

    public group = new InstancedMesh(this.boughGeometry, this.boughMaterial, 10000)

    constructor(public game: Game) {
        this.group.instanceMatrix.setUsage(DynamicDrawUsage)
        // this.game.subscribe((action, [actor]) => {
        //     if (!actor || actor.type !== this.actorType) return
        //     if (action === 'actorAdded') this.onAddActor(actor)
        //     if (action === 'actorRemoved') this.onRemoveActor(actor)
        // })
        // const treeActors = this.game.findActorsByType(this.actorType) as TreeActor[]
        // treeActors.forEach((actor) => {
        //     this.onAddActor(actor)
        // })
    }

    public onAddActor(actor: TreeActor) {
        // const tile = this.game.word.getTile(actor.position)
        // const group = this.createActorModel(actor, tile)
        // this.actorGroupRef[actor.id] = { group, actor }
        // this.group.add(group)
    }

    public onRemoveActor(actor: TreeActor) {
        // const ref = this.actorGroupRef[actor.id]
        // if (!ref) return
        // this.group.remove(ref.group)
        // delete this.actorGroupRef[actor.id]
    }

    private count = 0

    public render(clock: Clock) {
        const treeActors = this.game.findActorsByType(this.actorType) as TreeActor[]
        const dummy = new Object3D()

        for (let index = 0; index < Math.max(this.count, treeActors.length); index++) {
            const tree = treeActors[index]

            if (tree) {
                const [x, y] = tree.position
                const tile = this.game.word.getTile(tree.position)

                dummy.position.set(x, tile.height, y)
                dummy.scale.set(random(1, 1.5), random(1, 1.5), random(1, 1.5))
                dummy.rotation.set(
                    random(-0.1, 0.1) / Math.PI,
                    random(-0.1, 0.1) / Math.PI,
                    random(-0.1, 0.1) / Math.PI,
                )
            } else {
                // TODO better remove
                dummy.position.set(0, 0, 0)
                dummy.scale.set(2, 2, 2)
            }
            dummy.updateMatrix()
            this.group.setMatrixAt(index, dummy.matrix)
        }

        this.group.instanceMatrix.needsUpdate = true

        this.count = treeActors.length
    }

    // public updatePosition() {
    //     Object.values(this.actorGroupRef).forEach(({ group, actor }) => {
    //         const [x, y] = actor.position
    //         const tile = this.game.word.getTile(actor.position)
    //         const tileX = x * config.renderer.tileSize
    //         const tileY = y * config.renderer.tileSize
    //         group.position.x += (tileX - group.position.x) * this.moveSpeed
    //         group.position.z += (tileY - group.position.z) * this.moveSpeed
    //         group.position.y += (tile.height - group.position.y) * this.moveSpeed
    //     })
    // }

    // public createActorModel(actor: Actor, tile: Tile): Group {
    //     const [x, y] = actor.position
    //     const group = new Group()

    //     group.position.x = x * config.renderer.tileSize
    //     group.position.y = tile.height
    //     group.position.z = y * config.renderer.tileSize

    //     return group
    // }
}
