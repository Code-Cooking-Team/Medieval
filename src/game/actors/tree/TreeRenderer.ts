import { config } from '+config'
import { Actor } from '+game/core/Actor'
import { Game } from '+game/Game'
import { Tile } from '+game/Tile'
import { ActorType } from '+game/types'
import { random } from '+helpers/basic'
import { seededRandom } from '+helpers/random'
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

    private boughGeometry = new CylinderGeometry(0.2, 0.4, 3, 3)
    private boughMaterial = new MeshStandardMaterial({ color: 0x2e2625 })

    private coronaGeometry = new SphereGeometry(1.5, 5, 4)
    private coronaMaterial = new MeshStandardMaterial({ color: 0x2c420b })

    public group = new Group()
    public boughInstanceMesh = new InstancedMesh(
        this.boughGeometry,
        this.boughMaterial,
        3000,
    )

    public coronaInstanceMesh = new InstancedMesh(
        this.coronaGeometry,
        this.coronaMaterial,
        3000,
    )

    private actorCount = 0

    constructor(public game: Game) {
        this.boughInstanceMesh.instanceMatrix.setUsage(DynamicDrawUsage)
        this.boughInstanceMesh.castShadow = true
        this.boughInstanceMesh.receiveShadow = true

        this.coronaInstanceMesh.instanceMatrix.setUsage(DynamicDrawUsage)
        this.coronaInstanceMesh.castShadow = true
        this.coronaInstanceMesh.receiveShadow = true

        this.group.add(this.boughInstanceMesh)
        this.boughInstanceMesh.translateY(1.8)

        this.group.add(this.coronaInstanceMesh)
        this.coronaInstanceMesh.translateY(4.8)
    }

    public render(clock: Clock) {
        const treeActors = this.game.findActorsByType(this.actorType) as TreeActor[]
        const dummy = new Object3D()

        for (
            let index = 0;
            index < Math.max(this.actorCount, treeActors.length);
            index++
        ) {
            const tree = treeActors[index]

            if (tree) {
                const rnd = seededRandom(tree.seed)
                const [x, y] = tree.position
                const tile = this.game.word.getTile(tree.position)

                dummy.position.set(x, tile.height, y)
                dummy.scale.set(rnd(1, 1.5), rnd(1, 1.5), rnd(1, 1.5))
                dummy.rotation.set(
                    rnd(-0.1, 0.1) / Math.PI,
                    rnd(-0.1, 0.1) / Math.PI,
                    rnd(-0.1, 0.1) / Math.PI,
                )
            } else {
                // TODO better remove
                dummy.position.set(0, 0, 0)
                dummy.scale.set(2, 2, 2)
            }

            dummy.updateMatrix()
            this.boughInstanceMesh.setMatrixAt(index, dummy.matrix)
            this.coronaInstanceMesh.setMatrixAt(index, dummy.matrix)
        }

        this.boughInstanceMesh.instanceMatrix.needsUpdate = true
        this.coronaInstanceMesh.instanceMatrix.needsUpdate = true

        this.actorCount = treeActors.length
    }
}
