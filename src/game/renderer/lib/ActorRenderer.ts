import { config } from '+config'
import { StaticActor } from '+game/core/StaticActor'
import { Game } from '+game/Game'
import { Tile } from '+game/Tile'
import { ActorType, ClockInfo } from '+game/types'

import {
    BoxGeometry,
    DoubleSide,
    Group,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PlaneGeometry,
    Quaternion,
    Vector3,
} from 'three'

import { BasicRenderer } from './BasicRenderer'

export abstract class ActorRenderer<TActor extends StaticActor> extends BasicRenderer {
    public actorType: ActorType = ActorType.Empty
    public moveSpeed = 0.04

    private hpGeometry = new PlaneGeometry(2, 0.2, 1, 1)
    private hpMaterial = new MeshBasicMaterial({ color: 0xff0e00, side: DoubleSide })

    private actorGroupMap = new Map<TActor, Group>()
    private actorInteractionShapeMap = new Map<Mesh, TActor>()

    constructor(public game: Game) {
        super()

        this.game.emitter.on('actorAdded', (actor) => {
            if (actor.type === this.actorType) this.onAddActor(actor as TActor)
        })

        this.game.emitter.on('actorRemoved', (actor) => {
            if (actor.type === this.actorType) this.onRemoveActor(actor as TActor)
        })

        const treeActors = this.game.findActorsByType(this.actorType) as TActor[]

        treeActors.forEach((actor) => {
            this.onAddActor(actor)
        })
    }

    public createActorModel(
        actor: TActor,
        tile: Tile,
    ): { group: Group; interactionShape: Mesh } {
        const [x, y] = actor.position
        const group = new Group()

        const hp = new Mesh(this.hpGeometry, this.hpMaterial)
        hp.name = 'hp'
        hp.position.y = 5

        group.add(hp)

        const interactionShape = new Mesh(
            new BoxGeometry(1, 2, 1),
            new MeshBasicMaterial({ color: 0xffffff, wireframe: true }),
        )

        interactionShape.userData = { actor }
        group.add(interactionShape)

        group.position.x = x * config.renderer.tileSize
        group.position.y = tile.height + config.renderer.tileSize
        group.position.z = y * config.renderer.tileSize

        return { group, interactionShape }
    }

    public render(clockInfo: ClockInfo) {
        this.updatePosition()
        this.updateRotation()
        this.updateHP()
        this.updateSelect()
    }

    public getInteractionShapes(): Object3D[] {
        return Array.from(this.actorInteractionShapeMap.keys())
    }

    private onAddActor(actor: TActor) {
        const tile = this.game.word.getTile(actor.position)
        const { group, interactionShape } = this.createActorModel(actor, tile)

        this.actorGroupMap.set(actor, group)
        this.actorInteractionShapeMap.set(interactionShape, actor)
        this.group.add(group)
    }

    private onRemoveActor(actor: TActor) {
        const group = this.actorGroupMap.get(actor)

        if (!group) {
            throw new Error(`[ActorRenderer] Unable to remove actor ${actor.id}`)
        }

        this.group.remove(group)
        this.actorGroupMap.delete(actor)
    }

    private updatePosition() {
        this.actorGroupMap.forEach((group, actor) => {
            const [x, y] = actor.position
            const tile = this.game.word.getTile(actor.position)
            const tileX = x * config.renderer.tileSize
            const tileY = y * config.renderer.tileSize
            group.position.x += (tileX - group.position.x) * this.moveSpeed
            group.position.z += (tileY - group.position.z) * this.moveSpeed
            group.position.y += (tile.height - group.position.y) * this.moveSpeed
        })
    }
    private updateRotation() {
        this.actorGroupMap.forEach((group, actor) => {
            const [x, y] = actor.position

            const tile = this.game.word.getTile(actor.position)
            const tileX = x * config.renderer.tileSize
            const tileY = y * config.renderer.tileSize
            const actorPosition = group.position
            const targetPosition = new Vector3(tileX, tile.height, tileY)

            const distance = targetPosition.distanceTo(actorPosition)
            // set the rotation to the direction the actor is going
            if (distance > 1) {
                const direction = targetPosition.clone().sub(actorPosition)
                const rotation = direction.angleTo(new Vector3(0, 0, 1))
                console.log(direction.x > 0 ? rotation * -1 : rotation)
                let newRotation = direction.x > 0 ? rotation : rotation * -1

                const targetQuaternion = new Quaternion().setFromAxisAngle(
                    new Vector3(0, 1, 0),
                    newRotation,
                )
                if (!group.quaternion.equals(targetQuaternion)) {
                    // TODO time delta
                    var step = this.moveSpeed * 1.1
                    group.quaternion.rotateTowards(targetQuaternion, step)
                }

                // if (newRotation > group.rotation.y) {
                //     group.rotation.y += (newRotation - group.rotation.y) * this.moveSpeed
                // } else {
                //     group.rotation.y -= (newRotation + group.rotation.y) * this.moveSpeed
                // }
            }
        })
    }

    private updateHP() {
        this.actorGroupMap.forEach((group, actor) => {
            const hpMesh = group.getObjectByName('hp') as Mesh
            hpMesh.scale.x = actor.hp / actor.maxHp
            hpMesh.visible = actor.hp < actor.maxHp
        })
    }

    private updateSelect() {
        this.actorInteractionShapeMap.forEach((actor, shape) => {
            shape.visible = this.game.player.selectedActors.includes(actor)
        })
    }
}
