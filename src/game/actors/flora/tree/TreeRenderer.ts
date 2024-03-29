import { config } from '+config'
import { Game } from '+game/Game'
import { ActorType, ClockInfo, Renderable } from '+game/types'
import { multiplyPosition, seededRandom, updateObjectPosition } from '+helpers'

import {
    CylinderGeometry,
    DynamicDrawUsage,
    Group,
    InstancedMesh,
    MeshStandardMaterial,
    Object3D,
    SphereGeometry,
} from 'three'

import { TreeActor } from './TreeActor'

export class TreeRenderer implements Renderable {
    public actorType: ActorType = ActorType.Tree

    private boughGeometry = new CylinderGeometry(0.2, 0.4, 3, 3)
    private boughMaterial = new MeshStandardMaterial({
        color: 0x2e2625,
        metalness: 0.8,
        roughness: 1,
    })

    private coronaGeometry = new SphereGeometry(1.5, 5, 4)
    private coronaMaterial = new MeshStandardMaterial({
        color: 0x2c420b,
        metalness: 0.8,
        roughness: 0.9,
        flatShading: true,
    })

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
        this.boughInstanceMesh.translateY(1.8 * config.renderer.tileSize)

        this.group.add(this.coronaInstanceMesh)
        this.coronaInstanceMesh.translateY(4.5 * config.renderer.tileSize)
    }

    public render(clockInfo: ClockInfo) {
        const time = clockInfo.elapsedTime * 5
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
                const tile = this.game.world.getTile(tree.position)

                updateObjectPosition(dummy, tree.position, tile.height)

                dummy.scale.set(
                    rnd(0.8, 1.5) * config.renderer.tileSize,
                    rnd(1, 1.5) * config.renderer.tileSize,
                    rnd(0.8, 1.5) * config.renderer.tileSize,
                )

                dummy.rotation.set(
                    rnd(-0.5, 0.5) / Math.PI,
                    rnd(-0.5, 0.5) / Math.PI,
                    rnd(-0.5, 0.5) / Math.PI,
                )

                if (config.renderer.treeWaving) {
                    const sendX = dummy.scale.z * rnd(-0.5, 0.5)
                    const sendZ = dummy.scale.z * rnd(-0.5, 0.5)
                    dummy.rotation.z +=
                        Math.sin(sendX + time * 0.2 * (sendX * (Math.PI / 1))) / 15

                    dummy.position.x +=
                        Math.sin(sendX + time * 0.2 * (sendX * (Math.PI / 1))) / -8

                    dummy.rotation.x +=
                        Math.sin(sendZ + time * 0.2 * (sendZ * (Math.PI / 1))) / 15

                    dummy.position.z +=
                        Math.sin(sendZ + time * 0.2 * (sendZ * (Math.PI / 1))) / 8
                }
            } else {
                // TODO better remove
                dummy.position.set(0, 0, 0)
                dummy.scale.set(0, 0, 0)
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
